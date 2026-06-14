import { describe, expect, it } from "vitest"

import {
  acceptTransfer,
  initiateTransfer,
  type CustodySnapshot,
} from "@/lib/demo/custody-service"
import {
  SHAREABLE_ATTESTATION_KEYS,
  buildShareablePayload,
  computeAttestationId,
  evaluateAttestationReadiness,
  evidenceBindingReport,
  generateAttestation,
  parseShareablePayload,
  verifyAttestation,
} from "@/lib/demo/attestation"
import {
  NON_INVOLVED_PARTY_VIEW_ID,
  VERIFIER_PARTY_VIEW_ID,
} from "@/lib/demo/party-views"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import type { Asset, TransferAttachment } from "@/lib/types"

const ROUTE = ["silo", "railway-transport", "origin-port", "ship", "destination-port"]

/** Run the demo route end-to-end so the snapshot has a real, conserved chain. */
function routeSnapshot(options: { evidenceOnEveryLeg?: boolean } = {}): {
  snapshot: CustodySnapshot
  received: Asset
} {
  const evidenceOnEveryLeg = options.evidenceOnEveryLeg ?? true
  const origin: Asset = {
    id: "a-origin",
    accountId: "silo",
    commodity: "coffee",
    certifications: ["non-gmo", "deforestation-free"],
    rating: "A",
    quantity: 9_000,
    unit: "tons",
    originIdentifier: "origin-huila",
    originEvidence: [
      {
        id: "ev-origin",
        name: "origin-cert.pdf",
        mimeType: "application/pdf",
        size: 2048,
        hash: "0xorigin",
      },
    ],
    sourceLotIds: [],
  }

  let snapshot: CustodySnapshot = { assets: [origin], transfers: [] }

  for (let i = 0; i < ROUTE.length - 1; i++) {
    const from = ROUTE[i]
    const to = ROUTE[i + 1]
    const source = snapshot.assets.find((a) => a.accountId === from)
    if (!source) throw new Error(`no asset at ${from}`)

    const attachments: TransferAttachment[] = evidenceOnEveryLeg
      ? [
          {
            id: `ev-${to}`,
            name: `${to}-handoff.pdf`,
            mimeType: "application/pdf",
            size: 512,
            hash: `0xleg-${to}`,
          },
        ]
      : []

    const pending = initiateTransfer(snapshot, {
      partyViewId: from,
      fromAccountId: from,
      toAccountId: to,
      assetId: source.id,
      quantity: source.quantity,
      attachments,
    })
    const accepted = acceptTransfer(pending, {
      partyViewId: to,
      transferId: pending.transfer.id,
    })
    snapshot = { assets: accepted.assets, transfers: accepted.transfers }
  }

  const received = snapshot.assets.find(
    (a) => a.accountId === "destination-port"
  )
  if (!received) throw new Error("no received lot")
  return { snapshot, received }
}

describe("evaluateAttestationReadiness", () => {
  it("is ready for the authorized custodian with full evidence (AC1)", () => {
    const { snapshot, received } = routeSnapshot()
    const readiness = evaluateAttestationReadiness(
      received,
      snapshot,
      "destination-port"
    )
    expect(readiness.status).toBe("ready")
    expect(readiness.summary?.custodyComplete).toBe(true)
    expect(readiness.summary?.provenanceContinuous).toBe(true)
    expect(readiness.input).not.toBeNull()
  })

  it("warns (not blocks) when a custody step lacks evidence (AC3)", () => {
    const { snapshot, received } = routeSnapshot({ evidenceOnEveryLeg: false })
    const readiness = evaluateAttestationReadiness(
      received,
      snapshot,
      "destination-port"
    )
    expect(readiness.status).toBe("warning")
    expect(readiness.gaps.map((g) => g.code)).toContain("EVIDENCE_MISSING")
  })

  it("blocks and hides details for a private verifier view (AC4)", () => {
    const { snapshot, received } = routeSnapshot()
    const readiness = evaluateAttestationReadiness(
      received,
      snapshot,
      VERIFIER_PARTY_VIEW_ID
    )
    expect(readiness.status).toBe("blocked")
    expect(readiness.summary).toBeNull()
    expect(readiness.input).toBeNull()
    expect(readiness.gaps[0]?.code).toBe("UNAUTHORIZED")
  })

  it("blocks a non-custodian route party (AC2/AC4)", () => {
    const { snapshot, received } = routeSnapshot()
    const readiness = evaluateAttestationReadiness(received, snapshot, "silo")
    expect(readiness.status).toBe("blocked")
    expect(readiness.summary).toBeNull()
  })

  it("constrains the readiness input to the allowed shape (AC6)", () => {
    const { snapshot, received } = routeSnapshot()
    const readiness = evaluateAttestationReadiness(
      received,
      snapshot,
      "destination-port"
    )
    expect(Object.keys(readiness.input ?? {}).sort()).toEqual(
      [
        "certifications",
        "commodity",
        "custodyPath",
        "evidenceRefs",
        "issuer",
        "provenanceRefs",
        "recipient",
        "selectedQuantity",
        "unit",
      ].sort()
    )
    // No unrelated party's hidden node leaks into the custody path.
    const nodes = readiness.input?.custodyPath.map((s) => s.node) ?? []
    expect(nodes).toEqual(ROUTE)
  })
})

describe("generateAttestation", () => {
  it("produces all required fields (AC1)", () => {
    const { snapshot, received } = routeSnapshot()
    const att = generateAttestation(received, snapshot, "destination-port", {
      now: "2026-06-13T00:00:00.000Z",
    })
    expect(att.commodity).toBe("coffee")
    expect(att.quantity).toBe(9_000)
    expect(att.issuer).toBe("destination-port")
    expect(att.certifications.length).toBe(2)
    expect(att.custodyPath.map((s) => s.node)).toEqual(ROUTE)
    expect(att.evidenceRefs.length).toBeGreaterThan(0)
    expect(att.attestationId).toMatch(/^0x[0-9a-f]{64}$/)
  })

  it("is deterministic and changes only when bound inputs change (AC3)", () => {
    const { snapshot, received } = routeSnapshot()
    const a = generateAttestation(received, snapshot, "destination-port", {
      now: "2026-06-13T00:00:00.000Z",
    })
    const b = generateAttestation(received, snapshot, "destination-port", {
      now: "2099-01-01T00:00:00.000Z", // different metadata only
    })
    expect(a.attestationId).toBe(b.attestationId)

    const mutated = computeAttestationId({
      selectedQuantity: a.quantity + 1,
      issuer: a.issuer,
      recipient: a.recipient,
      commodity: a.commodity,
      unit: a.unit,
      certifications: a.certifications,
      custodyPath: a.custodyPath,
      provenanceRefs: a.provenanceRefs,
      evidenceRefs: a.evidenceRefs,
    })
    expect(mutated).not.toBe(a.attestationId)
  })

  it("throws ATTESTATION_NOT_AVAILABLE when readiness is blocked (AC4)", () => {
    const { snapshot, received } = routeSnapshot()
    try {
      generateAttestation(received, snapshot, VERIFIER_PARTY_VIEW_ID)
      throw new Error("expected throw")
    } catch (err) {
      expect(err).toBeInstanceOf(LedgerError)
      expect((err as LedgerError).code).toBe(
        LedgerErrorCode.ATTESTATION_NOT_AVAILABLE
      )
    }
  })

  it("shareable payload only exposes whitelisted keys (AC2/AC5)", () => {
    const { snapshot, received } = routeSnapshot()
    const att = generateAttestation(received, snapshot, "destination-port")
    const payload = buildShareablePayload(att)
    expect(Object.keys(payload).sort()).toEqual(
      [...SHAREABLE_ATTESTATION_KEYS].sort()
    )
  })
})

describe("verifyAttestation", () => {
  it("verifies a complete payload (AC2)", () => {
    const { snapshot, received } = routeSnapshot()
    const payload = buildShareablePayload(
      generateAttestation(received, snapshot, "destination-port")
    )
    const result = verifyAttestation(payload)
    expect(result.verified).toBe(true)
    expect(result.provenanceContinuous).toBe(true)
    expect(result.idAuthentic).toBe(true)
  })

  it("flags a tampered payload (AC4)", () => {
    const { snapshot, received } = routeSnapshot()
    const payload = buildShareablePayload(
      generateAttestation(received, snapshot, "destination-port")
    )
    const tampered = { ...payload, quantity: payload.quantity + 1 }
    const result = verifyAttestation(tampered)
    expect(result.idAuthentic).toBe(false)
    expect(result.verified).toBe(false)
  })

  it("flags a broken custody path (AC4)", () => {
    const { snapshot, received } = routeSnapshot()
    const payload = buildShareablePayload(
      generateAttestation(received, snapshot, "destination-port")
    )
    const broken = { ...payload, custodyPath: [] }
    const result = verifyAttestation(broken)
    expect(result.provenanceContinuous).toBe(false)
    expect(result.verified).toBe(false)
  })

  it("flags missing evidence", () => {
    const { snapshot, received } = routeSnapshot()
    const payload = buildShareablePayload(
      generateAttestation(received, snapshot, "destination-port")
    )
    // A proof with no bound evidence references must not verify.
    const noEvidence = { ...payload, evidenceRefs: [] }
    const result = verifyAttestation(noEvidence)
    expect(result.evidenceReferenced).toBe(false)
    expect(result.verified).toBe(false)
  })
})

describe("evidenceBindingReport", () => {
  it("maps every evidence ref to a custody step (AC1 of 4.4)", () => {
    const { snapshot, received } = routeSnapshot()
    const payload = buildShareablePayload(
      generateAttestation(received, snapshot, "destination-port")
    )
    const report = evidenceBindingReport(payload)
    expect(report.length).toBe(payload.evidenceRefs.length)
    expect(report.every((r) => r.bound)).toBe(true)
  })

  it("reports an unbound (dangling) evidence ref", () => {
    const { snapshot, received } = routeSnapshot()
    const payload = buildShareablePayload(
      generateAttestation(received, snapshot, "destination-port")
    )
    const dangling = {
      ...payload,
      evidenceRefs: [...payload.evidenceRefs, "0xdangling"],
    }
    const report = evidenceBindingReport(dangling)
    expect(report.find((r) => r.hash === "0xdangling")?.bound).toBe(false)
  })
})

describe("parseShareablePayload", () => {
  it("round-trips a valid payload", () => {
    const { snapshot, received } = routeSnapshot()
    const payload = buildShareablePayload(
      generateAttestation(received, snapshot, "destination-port")
    )
    const parsed = parseShareablePayload(JSON.stringify(payload))
    expect(parsed).toEqual(payload)
  })

  it("returns null for malformed input", () => {
    expect(parseShareablePayload("not json")).toBeNull()
    expect(parseShareablePayload("{}")).toBeNull()
  })
})

// Guard: verification must not depend on seed/store data — only the payload.
describe("non-involved party", () => {
  it("never becomes an authorized issuer", () => {
    const { snapshot, received } = routeSnapshot()
    const readiness = evaluateAttestationReadiness(
      received,
      snapshot,
      NON_INVOLVED_PARTY_VIEW_ID
    )
    expect(readiness.status).toBe("blocked")
    expect(readiness.summary).toBeNull()
  })
})
