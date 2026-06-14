#!/usr/bin/env node
import {
  acceptTransfer,
  initiateTransfer,
  type CustodySnapshot,
} from "@/lib/demo/custody-service"
import {
  SHAREABLE_ATTESTATION_KEYS,
  buildShareablePayload,
  computeAttestationId,
  evidenceBindingReport,
  generateAttestation,
  verifyAttestation,
  type ShareableAttestation,
} from "@/lib/demo/attestation"
import { snapshotPartyVisibility } from "@/lib/demo/visibility-matrix"
import {
  NON_INVOLVED_PARTY_VIEW_ID,
  VERIFIER_PARTY_VIEW_ID,
} from "@/lib/demo/party-views"
import type { Asset, TransferAttachment } from "@/lib/types"

const ROUTE = [
  "silo",
  "railway-transport",
  "origin-port",
  "ship",
  "destination-port",
]

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function ok(message: string): void {
  console.log(`✓ ${message}`)
}

/** Run the demo route so destination-port holds a real, evidence-bound lot. */
function buildRouteSnapshot(): { snapshot: CustodySnapshot; received: Asset } {
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
    if (!source) fail(`No lot at ${from}`)
    const attachments: TransferAttachment[] = [
      {
        id: `ev-${to}`,
        name: `${to}-handoff.pdf`,
        mimeType: "application/pdf",
        size: 512,
        hash: `0xleg-${to}`,
      },
    ]
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

  const received = snapshot.assets.find((a) => a.accountId === "destination-port")
  if (!received) fail("No received lot at destination-port")
  return { snapshot, received }
}

function main() {
  const { snapshot, received } = buildRouteSnapshot()

  // 1. Deterministic generation.
  const a = generateAttestation(received, snapshot, "destination-port", {
    now: "2026-06-13T00:00:00.000Z",
  })
  const b = generateAttestation(received, snapshot, "destination-port", {
    now: "2099-01-01T00:00:00.000Z",
  })
  if (a.attestationId !== b.attestationId) {
    fail("Generation is not deterministic across identical inputs")
  }
  const changed = computeAttestationId({
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
  if (changed === a.attestationId) {
    fail("Attestation id did not change when a bound input changed")
  }
  ok("Deterministic generation: stable id, changes on input change")

  const payload = buildShareablePayload(a)

  // 2. Evidence binding — every ref maps to a custody step.
  const binding = evidenceBindingReport(payload)
  if (binding.length === 0 || !binding.every((entry) => entry.bound)) {
    fail("Attestation has unbound/dangling evidence references")
  }
  ok(`Evidence binding: ${binding.length} reference(s) all bound to custody steps`)

  // 3. Verifier-only field exposure.
  const keys = Object.keys(payload).sort()
  if (JSON.stringify(keys) !== JSON.stringify([...SHAREABLE_ATTESTATION_KEYS].sort())) {
    fail(`Shared payload exposes unexpected keys: ${keys.join(", ")}`)
  }
  const FORBIDDEN = ["holdings", "balance", "balances", "counterparties", "accounts"]
  for (const key of keys) {
    if (FORBIDDEN.includes(key)) fail(`Forbidden field "${key}" leaked into proof`)
  }
  const verifierSnapshot = snapshotPartyVisibility(
    VERIFIER_PARTY_VIEW_ID,
    snapshot.assets,
    snapshot.transfers
  )
  if (verifierSnapshot.visibleHoldings.length > 0) {
    fail("Verifier must not see private holdings")
  }
  const nonInvolved = snapshotPartyVisibility(
    NON_INVOLVED_PARTY_VIEW_ID,
    snapshot.assets,
    snapshot.transfers
  )
  if (nonInvolved.visibleHoldings.length > 0) {
    fail("Non-involved company must not see private holdings")
  }
  ok("Verifier-only exposure: proof carries only selectively shared fields")

  // 4. Provenance continuity via the verifier path.
  const result = verifyAttestation(payload)
  if (!result.verified || !result.provenanceContinuous) {
    fail(`Verification failed: ${result.gaps.join("; ")}`)
  }
  ok("Provenance continuity: shared proof verifies end-to-end")

  // 5. Negative tests — prove the checks are real.
  runNegativeChecks(payload)

  console.log("Attestation verification passed.")
}

function runNegativeChecks(payload: ShareableAttestation): void {
  // (a) Removed evidence → binding check must catch the dangling ref.
  const dangling = {
    ...payload,
    evidenceRefs: [...payload.evidenceRefs, "0xdangling-not-bound"],
  }
  const danglingReport = evidenceBindingReport(dangling)
  if (danglingReport.every((entry) => entry.bound)) {
    fail("Negative test failed: dangling evidence ref was not detected")
  }

  // (b) Tampered field without recomputed id → tamper detection must fire.
  const tampered = { ...payload, quantity: payload.quantity + 1 }
  if (verifyAttestation(tampered).idAuthentic) {
    fail("Negative test failed: tampered payload reported as authentic")
  }

  // (c) Broken custody path → provenance continuity must fail.
  const broken = { ...payload, custodyPath: [] }
  if (verifyAttestation(broken).provenanceContinuous) {
    fail("Negative test failed: broken custody path reported continuous")
  }

  ok("Negative tests: tamper, dangling evidence, and broken path all caught")
}

main()
