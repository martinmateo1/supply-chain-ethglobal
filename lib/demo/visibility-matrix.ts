import { SEED_ASSETS, SEED_TRANSFERS } from "@/lib/data"
import {
  NON_INVOLVED_PARTY_VIEW_ID,
  VERIFIER_PARTY_VIEW_ID,
  DEMO_PARTY_VIEWS,
  type PartyView,
} from "@/lib/demo/party-views"
import {
  isAssetVisibleToParty,
  isTransferVisibleToParty,
  visibleEvidenceCountForParty,
} from "@/lib/provenance"
import type { Asset, Transfer } from "@/lib/types"

export type PartyVisibilitySnapshot = {
  partyViewId: string
  companyRole: PartyView["companyRole"]
  visibleHoldings: Asset[]
  visibleTransfersSent: Transfer[]
  visibleTransfersReceived: Transfer[]
  visibleEvidenceCount: number
}

export function snapshotPartyVisibility(
  partyViewId: string,
  assets: Asset[] = SEED_ASSETS,
  transfers: Transfer[] = SEED_TRANSFERS
): PartyVisibilitySnapshot {
  const view = DEMO_PARTY_VIEWS.find((item) => item.id === partyViewId)
  if (!view) {
    throw new Error(`Unknown party view: ${partyViewId}`)
  }

  const visibleHoldings = assets.filter((asset) =>
    isAssetVisibleToParty(asset, partyViewId, transfers)
  )
  const visibleTransfersSent = transfers.filter(
    (transfer) =>
      isTransferVisibleToParty(transfer, partyViewId) &&
      transfer.fromAccountId === partyViewId
  )
  const visibleTransfersReceived = transfers.filter(
    (transfer) =>
      isTransferVisibleToParty(transfer, partyViewId) &&
      transfer.toAccountId === partyViewId
  )

  return {
    partyViewId,
    companyRole: view.companyRole,
    visibleHoldings,
    visibleTransfersSent,
    visibleTransfersReceived,
    visibleEvidenceCount: visibleEvidenceCountForParty(partyViewId, transfers),
  }
}

/** Deterministic expectations used by scripts/verify-party-visibility.ts */
export const EXPECTED_VISIBILITY_MATRIX: Record<
  string,
  {
    minHoldings: number
    maxHoldings: number
    minTransfersSent: number
    maxTransfersSent: number
    minTransfersReceived: number
    maxTransfersReceived: number
    minEvidence: number
    maxEvidence: number
  }
> = {
  "production-site": {
    minHoldings: 8,
    maxHoldings: 8,
    minTransfersSent: 2,
    maxTransfersSent: 2,
    minTransfersReceived: 0,
    maxTransfersReceived: 0,
    minEvidence: 1,
    maxEvidence: 1,
  },
  "truck-transport": {
    minHoldings: 8,
    maxHoldings: 8,
    minTransfersSent: 1,
    maxTransfersSent: 1,
    minTransfersReceived: 2,
    maxTransfersReceived: 2,
    minEvidence: 3,
    maxEvidence: 3,
  },
  silo: {
    minHoldings: 12,
    maxHoldings: 12,
    minTransfersSent: 2,
    maxTransfersSent: 2,
    minTransfersReceived: 1,
    maxTransfersReceived: 1,
    minEvidence: 2,
    maxEvidence: 2,
  },
  "railway-transport": {
    minHoldings: 5,
    maxHoldings: 5,
    minTransfersSent: 1,
    maxTransfersSent: 1,
    minTransfersReceived: 2,
    maxTransfersReceived: 2,
    minEvidence: 0,
    maxEvidence: 0,
  },
  "origin-port": {
    minHoldings: 7,
    maxHoldings: 7,
    minTransfersSent: 1,
    maxTransfersSent: 1,
    minTransfersReceived: 1,
    maxTransfersReceived: 1,
    minEvidence: 0,
    maxEvidence: 0,
  },
  ship: {
    minHoldings: 4,
    maxHoldings: 4,
    minTransfersSent: 1,
    maxTransfersSent: 1,
    minTransfersReceived: 1,
    maxTransfersReceived: 1,
    minEvidence: 0,
    maxEvidence: 0,
  },
  "destination-port": {
    minHoldings: 6,
    maxHoldings: 6,
    minTransfersSent: 0,
    maxTransfersSent: 0,
    minTransfersReceived: 1,
    maxTransfersReceived: 1,
    minEvidence: 0,
    maxEvidence: 0,
  },
  [VERIFIER_PARTY_VIEW_ID]: {
    minHoldings: 0,
    maxHoldings: 0,
    minTransfersSent: 0,
    maxTransfersSent: 0,
    minTransfersReceived: 0,
    maxTransfersReceived: 0,
    minEvidence: 0,
    maxEvidence: 0,
  },
  [NON_INVOLVED_PARTY_VIEW_ID]: {
    minHoldings: 0,
    maxHoldings: 0,
    minTransfersSent: 0,
    maxTransfersSent: 0,
    minTransfersReceived: 0,
    maxTransfersReceived: 0,
    minEvidence: 0,
    maxEvidence: 0,
  },
}

export function verifyVisibilityMatrix(
  assets: Asset[] = SEED_ASSETS,
  transfers: Transfer[] = SEED_TRANSFERS
): { ok: boolean; failures: string[] } {
  const failures: string[] = []

  for (const view of DEMO_PARTY_VIEWS) {
    const expected = EXPECTED_VISIBILITY_MATRIX[view.id]
    if (!expected) {
      failures.push(`Missing visibility expectations for ${view.id}`)
      continue
    }

    const snapshot = snapshotPartyVisibility(view.id, assets, transfers)

    const checks: [string, number, number, number][] = [
      [
        "holdings",
        snapshot.visibleHoldings.length,
        expected.minHoldings,
        expected.maxHoldings,
      ],
      [
        "transfers sent",
        snapshot.visibleTransfersSent.length,
        expected.minTransfersSent,
        expected.maxTransfersSent,
      ],
      [
        "transfers received",
        snapshot.visibleTransfersReceived.length,
        expected.minTransfersReceived,
        expected.maxTransfersReceived,
      ],
      [
        "evidence",
        snapshot.visibleEvidenceCount,
        expected.minEvidence,
        expected.maxEvidence,
      ],
    ]

    for (const [label, actual, min, max] of checks) {
      if (actual < min || actual > max) {
        failures.push(
          `${view.id}: expected ${label} in [${min}, ${max}], got ${actual}`
        )
      }
    }
  }

  return { ok: failures.length === 0, failures }
}
