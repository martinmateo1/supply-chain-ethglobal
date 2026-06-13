import { assetKey, type Asset, type Transfer } from "@/lib/types"

export function tokenId(assetId: string): string {
  const suffix = assetId.replace(/^a/, "").slice(-4).padStart(4, "0")
  return `#A-${suffix}`
}

/**
 * Walk the sourceAssetIds graph upward from `startId` and return every
 * ancestor asset ID (BFS, excluding the start asset itself).
 * Used for attestation, double-spend detection, and provenance display.
 */
export function buildProvenanceChain(
  startId: string,
  assets: Asset[]
): string[] {
  const assetMap = new Map(assets.map((a) => [a.id, a]))
  const visited = new Set<string>()
  const queue: string[] = [startId]

  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const asset = assetMap.get(id)
    if (asset?.sourceAssetIds) {
      for (const src of asset.sourceAssetIds) {
        if (!visited.has(src)) queue.push(src)
      }
    }
  }

  visited.delete(startId)
  return [...visited]
}

/**
 * Return all unique source account IDs that contributed to an asset,
 * tracing the full provenance chain.  Useful for showing how many
 * distinct upstream wallets a holding can be traced back to.
 */
export function sourceAccountIds(
  startId: string,
  assets: Asset[]
): string[] {
  const ancestorIds = buildProvenanceChain(startId, assets)
  const assetMap = new Map(assets.map((a) => [a.id, a]))
  const accounts = new Set<string>()
  for (const id of ancestorIds) {
    const a = assetMap.get(id)
    if (a) accounts.add(a.accountId)
  }
  return [...accounts]
}

export function deterministicHash(seed: string): string {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, "0").slice(0, 8)}`
}

export function originFingerprint(
  asset: Pick<Asset, "commodity" | "certifications" | "rating">
): string {
  return deterministicHash(
    `${assetKey(asset.commodity, asset.certifications)}:${asset.rating}`
  )
}

export function transferMatchesAsset(transfer: Transfer, asset: Asset): boolean {
  return (
    transfer.fromAssetId === asset.id || transfer.toAssetId === asset.id
  )
}

export function isAssetVisibleToParty(
  asset: Asset,
  partyId: string,
  transfers: Transfer[]
): boolean {
  if (asset.accountId === partyId) return true

  return transfers.some(
    (transfer) =>
      transferMatchesAsset(transfer, asset) &&
      (transfer.fromAccountId === partyId || transfer.toAccountId === partyId)
  )
}
