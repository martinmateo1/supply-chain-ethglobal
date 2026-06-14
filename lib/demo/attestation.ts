/**
 * Selective custody-chain attestation — READ-ONLY projection layer for Epic 4.
 *
 * Custody truth lives on Canton/Daml; this module never mutates prior custody
 * state. It derives readiness, generates a `TraceabilityAttestation` projection,
 * and verifies a shared proof — all from `Asset` + `Transfer[]` via the existing
 * `buildCustodyPath` / `buildProvenanceTimeline` projections.
 *
 * Privacy contract: generation and verification only ever read the constrained
 * `AttestationReadinessInput` shape (selected quantity, issuer, recipient,
 * VISIBLE custody path, provenance references, evidence references). Hidden
 * fields from unrelated parties are structurally unavailable here.
 */
import {
  buildCustodyPath,
  buildProvenanceTimeline,
  type CustodyPathStep,
  type CustodySnapshot,
} from "@/lib/demo/custody-service"
import { canonicalHash } from "@/lib/demo/canonical-hash"
import { partyViewById } from "@/lib/demo/party-views"
import { isPrivatePartyView } from "@/lib/provenance"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import type { Asset, Certification, CommodityType } from "@/lib/types"

export type AttestationStatus = "ready" | "warning" | "blocked"

export type AttestationGapCode =
  | "UNAUTHORIZED"
  | "CUSTODY_INCOMPLETE"
  | "PROVENANCE_DISCONTINUOUS"
  | "EVIDENCE_MISSING"

export type AttestationGap = {
  code: AttestationGapCode
  message: string
}

/** A single projected custody step in the shared proof (no counterparties beyond the path). */
export type AttestationPathStep = {
  node: string
  quantity: number
  occurredAt: string | null
  evidenceHashes: string[]
  provenanceRef: string | null
}

/**
 * The ONLY input shape attestation logic may read. Anything not on this object
 * (other parties' holdings, balances, counterparties, hidden legs) is, by
 * construction, unavailable to readiness/generation/verification.
 */
export type AttestationReadinessInput = {
  selectedQuantity: number
  issuer: string
  recipient: string
  commodity: CommodityType
  unit: "tons"
  certifications: Certification[]
  custodyPath: AttestationPathStep[]
  provenanceRefs: string[]
  evidenceRefs: string[]
}

export type AttestationReadiness = {
  status: AttestationStatus
  gaps: AttestationGap[]
  /** null when the active party is not authorized (privacy-gated). */
  input: AttestationReadinessInput | null
  summary: {
    commodity: CommodityType
    quantity: number
    unit: "tons"
    currentNode: string
    certifications: Certification[]
    issuer: string
    recipient: string
    custodyStepCount: number
    evidenceCount: number
    custodyComplete: boolean
    provenanceContinuous: boolean
    evidenceComplete: boolean
  } | null
}

export type TraceabilityAttestation = {
  attestationId: string
  commodity: CommodityType
  quantity: number
  unit: "tons"
  issuer: string
  recipient: string
  certifications: Certification[]
  custodyPath: AttestationPathStep[]
  provenanceRefs: string[]
  evidenceRefs: string[]
  generatedAt: string
}

/** The selectively-shared payload a verifier receives. Equal to the whitelisted projection. */
export type ShareableAttestation = Omit<TraceabilityAttestation, "generatedAt"> & {
  generatedAt: string
}

export type VerificationResult = {
  provenanceContinuous: boolean
  certificationsPresent: boolean
  evidenceReferenced: boolean
  idAuthentic: boolean
  gaps: string[]
  verified: boolean
}

/** Default recipient for the demo attestation hand-off (the in-app verifier). */
export const DEFAULT_ATTESTATION_RECIPIENT = "CertChain Verifier"

function isAuthorizedCustodian(asset: Asset, partyViewId: string): boolean {
  if (isPrivatePartyView(partyViewId)) return false
  const view = partyViewById(partyViewId)
  const nodeId = view?.operationalNodeId ?? partyViewId
  // Only the current custodian of the received Lot Position may attest it.
  return asset.accountId === nodeId
}

function projectStep(step: CustodyPathStep): AttestationPathStep {
  return {
    node: step.accountId,
    quantity: step.quantity,
    occurredAt: step.occurredAt,
    evidenceHashes: step.evidenceHashes,
    provenanceRef: step.sourceProvenanceRef,
  }
}

/**
 * Evaluate attestation readiness for a received Lot Position from the active
 * Party View. Pure and visibility-scoped.
 *
 * - blocked: unauthorized, custody path does not reach the active node, or the
 *   provenance timeline is discontinuous.
 * - warning: custody complete but one or more custody steps lack evidence.
 * - ready: custody complete, continuous, and every step has evidence.
 */
export function evaluateAttestationReadiness(
  asset: Asset,
  snapshot: CustodySnapshot,
  partyViewId: string,
  recipient: string = DEFAULT_ATTESTATION_RECIPIENT
): AttestationReadiness {
  if (!isAuthorizedCustodian(asset, partyViewId)) {
    return {
      status: "blocked",
      gaps: [
        {
          code: "UNAUTHORIZED",
          message:
            "Selective visibility: this Party View is not the current custodian of this lot position, so no attestation details are available.",
        },
      ],
      input: null,
      summary: null,
    }
  }

  // Scope to the active party's visible transfers. The current custodian sees
  // the full batch chain (demo product decision, mirrored from asset detail).
  const view = partyViewById(partyViewId)
  const nodeId = view?.operationalNodeId ?? partyViewId
  const visibleTransfers =
    asset.accountId === nodeId
      ? snapshot.transfers
      : snapshot.transfers.filter(
          (t) => t.fromAccountId === nodeId || t.toAccountId === nodeId
        )

  const path = buildCustodyPath(asset, visibleTransfers)
  const custodyPath = path.map(projectStep)
  const evidenceRefs = Array.from(
    new Set(custodyPath.flatMap((s) => s.evidenceHashes))
  )
  const provenanceRefs = Array.from(
    new Set(
      custodyPath
        .map((s) => s.provenanceRef)
        .filter((ref): ref is string => Boolean(ref))
    )
  )
  const input: AttestationReadinessInput = {
    selectedQuantity: asset.quantity,
    issuer: asset.accountId,
    recipient,
    commodity: asset.commodity,
    unit: "tons",
    certifications: asset.certifications,
    custodyPath,
    provenanceRefs,
    evidenceRefs,
  }

  const timeline = buildProvenanceTimeline(asset, snapshot, visibleTransfers)
  const provenanceContinuous =
    timeline.length > 0 && timeline.every((entry) => entry.conserved)
  // Custody is "complete" when the path terminates at the attesting node.
  const lastStep = custodyPath[custodyPath.length - 1]
  const custodyComplete = Boolean(lastStep && lastStep.node === asset.accountId)
  // Every non-origin leg should carry at least one bound evidence hash.
  const legs = custodyPath.slice(1)
  const evidenceComplete =
    legs.length === 0
      ? custodyPath[0]?.evidenceHashes.length > 0
      : legs.every((step) => step.evidenceHashes.length > 0)

  const gaps: AttestationGap[] = []
  if (!custodyComplete) {
    gaps.push({
      code: "CUSTODY_INCOMPLETE",
      message:
        "The visible custody chain does not yet terminate at your operational node. Accept the inbound custody transfer to complete the chain.",
    })
  }
  if (!provenanceContinuous) {
    gaps.push({
      code: "PROVENANCE_DISCONTINUOUS",
      message:
        "A provenance step failed conservation. The chain must be continuous before an attestation can be generated.",
    })
  }
  if (!evidenceComplete) {
    gaps.push({
      code: "EVIDENCE_MISSING",
      message:
        "One or more custody steps have no bound evidence. The attestation will not imply evidence it does not have.",
    })
  }

  const status: AttestationStatus =
    !custodyComplete || !provenanceContinuous
      ? "blocked"
      : evidenceComplete
        ? "ready"
        : "warning"

  return {
    status,
    gaps,
    input,
    summary: {
      commodity: asset.commodity,
      quantity: asset.quantity,
      unit: "tons",
      currentNode: asset.accountId,
      certifications: asset.certifications,
      issuer: asset.accountId,
      recipient,
      custodyStepCount: custodyPath.length,
      evidenceCount: evidenceRefs.length,
      custodyComplete,
      provenanceContinuous,
      evidenceComplete,
    },
  }
}

/**
 * Compute the deterministic attestation id over the bound inputs ONLY.
 * `generatedAt` is metadata and is intentionally excluded so identical inputs
 * always reproduce the same id; any changed bound input changes the id.
 */
export function computeAttestationId(input: AttestationReadinessInput): string {
  return canonicalHash({
    selectedQuantity: input.selectedQuantity,
    issuer: input.issuer,
    recipient: input.recipient,
    commodity: input.commodity,
    unit: input.unit,
    certifications: [...input.certifications].sort(),
    custodyPath: input.custodyPath,
    provenanceRefs: [...input.provenanceRefs].sort(),
    evidenceRefs: [...input.evidenceRefs].sort(),
  })
}

/**
 * Generate a selective `TraceabilityAttestation` projection. Guarded by
 * readiness: throws `ATTESTATION_NOT_AVAILABLE` when blocked, never emitting a
 * partial proof. Output is whitelisted — no holdings, balances, or unrelated
 * counterparties.
 */
export function generateAttestation(
  asset: Asset,
  snapshot: CustodySnapshot,
  partyViewId: string,
  options?: { recipient?: string; now?: string }
): TraceabilityAttestation {
  const recipient = options?.recipient ?? DEFAULT_ATTESTATION_RECIPIENT
  const readiness = evaluateAttestationReadiness(
    asset,
    snapshot,
    partyViewId,
    recipient
  )

  if (readiness.status === "blocked" || !readiness.input) {
    const reason = readiness.gaps[0]?.message ?? "Attestation is not available."
    throw new LedgerError(LedgerErrorCode.ATTESTATION_NOT_AVAILABLE, reason)
  }

  const input = readiness.input
  return {
    attestationId: computeAttestationId(input),
    commodity: input.commodity,
    quantity: input.selectedQuantity,
    unit: input.unit,
    issuer: input.issuer,
    recipient: input.recipient,
    certifications: input.certifications,
    custodyPath: input.custodyPath,
    provenanceRefs: input.provenanceRefs,
    evidenceRefs: input.evidenceRefs,
    generatedAt: options?.now ?? new Date().toISOString(),
  }
}

/** The exact set of top-level keys allowed in a shared attestation payload. */
export const SHAREABLE_ATTESTATION_KEYS = [
  "attestationId",
  "commodity",
  "quantity",
  "unit",
  "issuer",
  "recipient",
  "certifications",
  "custodyPath",
  "provenanceRefs",
  "evidenceRefs",
  "generatedAt",
] as const

/** Build the selectively-shared payload (the only thing a verifier ever sees). */
export function buildShareablePayload(
  attestation: TraceabilityAttestation
): ShareableAttestation {
  return {
    attestationId: attestation.attestationId,
    commodity: attestation.commodity,
    quantity: attestation.quantity,
    unit: attestation.unit,
    issuer: attestation.issuer,
    recipient: attestation.recipient,
    certifications: attestation.certifications,
    custodyPath: attestation.custodyPath,
    provenanceRefs: attestation.provenanceRefs,
    evidenceRefs: attestation.evidenceRefs,
    generatedAt: attestation.generatedAt,
  }
}

function isAttestationPathStep(value: unknown): value is AttestationPathStep {
  if (!value || typeof value !== "object") return false
  const step = value as Record<string, unknown>
  return (
    typeof step.node === "string" &&
    typeof step.quantity === "number" &&
    (step.occurredAt === null || typeof step.occurredAt === "string") &&
    Array.isArray(step.evidenceHashes) &&
    (step.provenanceRef === null || typeof step.provenanceRef === "string")
  )
}

/**
 * Defensively parse a pasted/shared payload into a `ShareableAttestation`.
 * Returns null on malformed input instead of throwing.
 */
export function parseShareablePayload(raw: string): ShareableAttestation | null {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (!value || typeof value !== "object") return null
  const p = value as Record<string, unknown>

  if (
    typeof p.attestationId !== "string" ||
    (p.commodity !== "coffee" && p.commodity !== "cacao") ||
    typeof p.quantity !== "number" ||
    p.unit !== "tons" ||
    typeof p.issuer !== "string" ||
    typeof p.recipient !== "string" ||
    !Array.isArray(p.certifications) ||
    !Array.isArray(p.custodyPath) ||
    !p.custodyPath.every(isAttestationPathStep) ||
    !Array.isArray(p.provenanceRefs) ||
    !Array.isArray(p.evidenceRefs) ||
    typeof p.generatedAt !== "string"
  ) {
    return null
  }

  return {
    attestationId: p.attestationId,
    commodity: p.commodity,
    quantity: p.quantity,
    unit: "tons",
    issuer: p.issuer,
    recipient: p.recipient,
    certifications: p.certifications as Certification[],
    custodyPath: p.custodyPath as AttestationPathStep[],
    provenanceRefs: p.provenanceRefs as string[],
    evidenceRefs: p.evidenceRefs as string[],
    generatedAt: p.generatedAt,
  }
}

/**
 * Verify a shared attestation using ONLY the payload content (no ledger access).
 * This is what proves selective disclosure: the verifier confirms the claim from
 * the shared facts alone.
 */
export function verifyAttestation(
  payload: ShareableAttestation
): VerificationResult {
  const gaps: string[] = []

  // Provenance continuity over the SHARED custody path (ordered, non-empty,
  // each step's quantity matches the attested quantity for a clean transfer
  // chain — splits/combines would surface as quantity changes the verifier can
  // see but cannot reconcile without the ledger, so we only assert order +
  // presence + terminal quantity here).
  const path = payload.custodyPath
  const provenanceContinuous =
    path.length > 0 &&
    path[path.length - 1].quantity === payload.quantity &&
    path.every((step, i) => i === 0 || step.occurredAt !== null)
  if (!provenanceContinuous) {
    gaps.push("Shared custody path is incomplete or does not reconcile to the attested quantity.")
  }

  const certificationsPresent = payload.certifications.length > 0
  if (!certificationsPresent) {
    gaps.push("No certifications are present in the shared attestation.")
  }

  const evidenceReferenced = payload.evidenceRefs.length > 0
  if (!evidenceReferenced) {
    gaps.push("No evidence references are bound to the shared custody path.")
  }

  // Tamper check: recompute the id from the payload's bound inputs.
  const recomputed = computeAttestationId({
    selectedQuantity: payload.quantity,
    issuer: payload.issuer,
    recipient: payload.recipient,
    commodity: payload.commodity,
    unit: payload.unit,
    certifications: payload.certifications,
    custodyPath: payload.custodyPath,
    provenanceRefs: payload.provenanceRefs,
    evidenceRefs: payload.evidenceRefs,
  })
  const idAuthentic = recomputed === payload.attestationId
  if (!idAuthentic) {
    gaps.push("Attestation id does not match its contents — the proof may have been tampered with.")
  }

  return {
    provenanceContinuous,
    certificationsPresent,
    evidenceReferenced,
    idAuthentic,
    gaps,
    verified:
      provenanceContinuous &&
      certificationsPresent &&
      evidenceReferenced &&
      idAuthentic,
  }
}

/** Stable per-evidence verification: each ref must bind to a custody step. */
export function evidenceBindingReport(
  payload: ShareableAttestation
): { hash: string; boundToNode: string | null; bound: boolean }[] {
  return payload.evidenceRefs.map((hash) => {
    const step = payload.custodyPath.find((s) =>
      s.evidenceHashes.includes(hash)
    )
    return { hash, boundToNode: step?.node ?? null, bound: Boolean(step) }
  })
}
