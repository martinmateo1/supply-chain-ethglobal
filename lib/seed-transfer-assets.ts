import { SEED_ASSETS } from "@/lib/data"
import {
  certificationKey,
  type Certification,
  type CommodityType,
  type Rating,
  type Transfer,
} from "@/lib/types"

function findSeedAssetId(
  accountId: string,
  commodity: CommodityType,
  certifications: Certification[],
  rating: Rating
): string | undefined {
  const key = certificationKey(certifications)

  return SEED_ASSETS.find(
    (asset) =>
      asset.accountId === accountId &&
      asset.commodity === commodity &&
      asset.rating === rating &&
      certificationKey(asset.certifications) === key
  )?.id
}

export function withSeedTransferAssetIds(transfers: Transfer[]): Transfer[] {
  return transfers.map((transfer) => {
    if (transfer.assetId) return transfer

    const assetId = findSeedAssetId(
      transfer.fromAccountId,
      transfer.commodity,
      transfer.certifications,
      transfer.rating
    )

    return assetId ? { ...transfer, assetId } : transfer
  })
}
