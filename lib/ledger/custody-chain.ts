import type { CustodyPathStep } from "@/lib/demo/custody-service"
import { partyHintFromId } from "@/lib/ledger/mappers"
import type { Asset, CustodyChainEntry, Transfer } from "@/lib/types"

export type LedgerProvenanceEntry = {
  fromParty: string
  toParty: string
  transferId: string
  evidenceHashes: string[]
  occurredAt: string
}

export function mapLedgerProvenanceToCustodyChain(
  entries: LedgerProvenanceEntry[],
): CustodyChainEntry[] {
  return entries.map((entry, index) => ({
    fromAccountId: partyHintFromId(entry.fromParty),
    toAccountId: partyHintFromId(entry.toParty),
    transferId: entry.transferId,
    evidenceHashes: entry.evidenceHashes,
    occurredAt: entry.occurredAt,
    claimType:
      index === 0 && entries.length === 1 && entry.fromParty === entry.toParty
        ? "origin_attested"
        : index === 0
          ? "origin_attested"
          : "chain_of_custody_continuous",
  }))
}

export function parseLedgerProvenancePayload(
  value: unknown,
): LedgerProvenanceEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const row = entry as Record<string, unknown>
      return {
        fromParty: String(row.fromParty ?? ""),
        toParty: String(row.toParty ?? ""),
        transferId: String(row.transferId ?? ""),
        evidenceHashes: Array.isArray(row.evidenceHashes)
          ? row.evidenceHashes.map(String)
          : [],
        occurredAt: String(row.occurredAt ?? ""),
      }
    })
    .filter((entry): entry is LedgerProvenanceEntry => entry !== null)
}

/**
 * Build a custody path from the lineage carried on the lot (Canton mode).
 * Reaches origin across privacy boundaries without querying upstream contracts.
 */
export function buildCustodyPathFromChain(asset: Asset): CustodyPathStep[] {
  const chain = asset.custodyChain ?? []
  if (chain.length === 0) {
    return [
      {
        accountId: asset.accountId,
        quantity: asset.quantity,
        transferId: null,
        evidenceHashes: (asset.originEvidence ?? []).map((e) => e.hash),
        sourceProvenanceRef: asset.originIdentifier ?? null,
        occurredAt: null,
      },
    ]
  }

  const origin = chain[0]
  const path: CustodyPathStep[] = [
    {
      accountId: origin.fromAccountId || origin.toAccountId || asset.accountId,
      quantity: asset.quantity,
      transferId: origin.transferId || null,
      evidenceHashes: origin.evidenceHashes,
      sourceProvenanceRef: asset.originIdentifier ?? null,
      occurredAt: origin.occurredAt || null,
    },
  ]

  for (const hop of chain.slice(1)) {
    path.push({
      accountId: hop.toAccountId,
      quantity: asset.quantity,
      transferId: hop.transferId,
      evidenceHashes: hop.evidenceHashes,
      sourceProvenanceRef: asset.originIdentifier ?? null,
      occurredAt: hop.occurredAt || null,
    })
  }

  const last = path[path.length - 1]
  if (last && last.accountId !== asset.accountId) {
    path.push({
      accountId: asset.accountId,
      quantity: asset.quantity,
      transferId: null,
      evidenceHashes: [],
      sourceProvenanceRef: asset.originIdentifier ?? null,
      occurredAt: null,
    })
  }

  return path
}

export function transfersFromCustodyChain(
  asset: Asset,
  chain: CustodyChainEntry[] = asset.custodyChain ?? [],
): Transfer[] {
  return chain
    .filter((hop, index) => index > 0 || hop.fromAccountId !== hop.toAccountId)
    .map((hop) => ({
      id: hop.transferId,
      fromAccountId: hop.fromAccountId,
      toAccountId: hop.toAccountId,
      assetId: asset.lotId ?? asset.id,
      commodity: asset.commodity,
      certifications: asset.certifications,
      rating: asset.rating,
      quantity: asset.quantity,
      unit: "tons" as const,
      status: "accepted" as const,
      createdAt: hop.occurredAt || new Date(0).toISOString(),
      occurredAt: hop.occurredAt || undefined,
      ...(asset.originIdentifier
        ? { sourceProvenanceRef: asset.originIdentifier }
        : {}),
      attachments: hop.evidenceHashes.map((hash, index) => ({
        id: `att-${hop.transferId}-${index}`,
        name: hash,
        mimeType: "application/octet-stream",
        size: 0,
        hash,
      })),
    }))
}

/** Mask upstream party identities beyond the immediate predecessor. */
export function redactAccountLabel(
  accountId: string,
  visibilityPartyId: string,
  assetAccountId: string,
  immediatePredecessorId: string | null,
): string {
  if (accountId === visibilityPartyId || accountId === assetAccountId) {
    return accountId
  }
  if (immediatePredecessorId && accountId === immediatePredecessorId) {
    return accountId
  }
  return "verified-redacted"
}

export function immediatePredecessorForAsset(asset: Asset): string | null {
  const chain = asset.custodyChain ?? []
  const inbound = [...chain]
    .reverse()
    .find((hop) => hop.toAccountId === asset.accountId)
  return inbound?.fromAccountId ?? null
}
