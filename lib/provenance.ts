import {
  NON_INVOLVED_PARTY_VIEW_ID,
  VERIFIER_PARTY_VIEW_ID,
} from "@/lib/demo/party-views"
import { assetKey, certificationKey, type Asset, type Transfer } from "@/lib/types"

export function isPrivatePartyView(partyViewId: string): boolean {
  return (
    partyViewId === NON_INVOLVED_PARTY_VIEW_ID ||
    partyViewId === VERIFIER_PARTY_VIEW_ID
  )
}

export function tokenId(assetId: string): string {
  const suffix = assetId.replace(/^a/, "").slice(-4).padStart(4, "0")
  return `#A-${suffix}`
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
  if (transfer.assetId === asset.id) return true

  const sameBatch =
    transfer.commodity === asset.commodity &&
    transfer.rating === asset.rating &&
    certificationKey(transfer.certifications) ===
      certificationKey(asset.certifications)

  if (!sameBatch) return false

  return (
    transfer.fromAccountId === asset.accountId ||
    transfer.toAccountId === asset.accountId
  )
}

export function isAssetVisibleToParty(
  asset: Asset,
  partyId: string,
  transfers: Transfer[]
): boolean {
  if (isPrivatePartyView(partyId)) return false
  if (asset.accountId === partyId) return true

  return transfers.some(
    (transfer) =>
      transferMatchesAsset(transfer, asset) &&
      (transfer.fromAccountId === partyId || transfer.toAccountId === partyId)
  )
}

export function isTransferVisibleToParty(
  transfer: Transfer,
  partyViewId: string
): boolean {
  if (isPrivatePartyView(partyViewId)) return false
  return (
    transfer.fromAccountId === partyViewId ||
    transfer.toAccountId === partyViewId
  )
}

export function visibleEvidenceCountForParty(
  partyViewId: string,
  transfers: Transfer[]
): number {
  return transfers
    .filter((transfer) => isTransferVisibleToParty(transfer, partyViewId))
    .reduce((count, transfer) => count + (transfer.attachments?.length ?? 0), 0)
}
