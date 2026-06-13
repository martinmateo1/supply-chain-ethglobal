#!/usr/bin/env node
import {
  acceptTransfer,
  initiateTransfer,
  rejectTransfer,
  reservedQuantityForAsset,
} from "@/lib/demo/custody-service"
import { SEED_ASSETS, SEED_TRANSFERS } from "@/lib/data"
import { withSeedTransferAssetIds } from "@/lib/seed-transfer-assets"

function main() {
  const assets = [...SEED_ASSETS]
  const transfers = withSeedTransferAssetIds([...SEED_TRANSFERS])

  const sourceAsset = assets.find((asset) => asset.accountId === "production-site")
  if (!sourceAsset) {
    console.error("Expected a production-site seed asset.")
    process.exit(1)
  }

  const pending = initiateTransfer(
    { assets, transfers },
    {
      partyViewId: "production-site",
      fromAccountId: "production-site",
      toAccountId: "truck-transport",
      assetId: sourceAsset.id,
      quantity: 500,
      attachments: [
        {
          id: "att-test",
          name: "test-weighbridge.pdf",
          mimeType: "application/pdf",
          size: 1024,
          hash: "0xabc123",
        },
      ],
    }
  )

  const reserved = reservedQuantityForAsset(sourceAsset.id, pending.transfers)
  if (reserved !== 500) {
    console.error(`Expected 500t reserved, got ${reserved}`)
    process.exit(1)
  }

  try {
    initiateTransfer(
      { assets: pending.assets, transfers: pending.transfers },
      {
        partyViewId: "production-site",
        fromAccountId: "production-site",
        toAccountId: "truck-transport",
        assetId: sourceAsset.id,
        quantity: sourceAsset.quantity,
      }
    )
    console.error("Double-spend attempt should have failed.")
    process.exit(1)
  } catch {
    console.log("Double-spend blocked as expected.")
  }

  const accepted = acceptTransfer(
    { assets: pending.assets, transfers: pending.transfers },
    { partyViewId: "truck-transport", transferId: pending.transfer.id }
  )

  if (accepted.transfer.status !== "accepted") {
    console.error("Expected accepted transfer status.")
    process.exit(1)
  }

  const rejectedSnapshot = initiateTransfer(
    { assets: accepted.assets, transfers: accepted.transfers },
    {
      partyViewId: "production-site",
      fromAccountId: "production-site",
      toAccountId: "silo",
      assetId: sourceAsset.id,
      quantity: 250,
    }
  )

  const rejected = rejectTransfer(
    {
      assets: rejectedSnapshot.assets,
      transfers: rejectedSnapshot.transfers,
    },
    {
      partyViewId: "silo",
      transferId: rejectedSnapshot.transfer.id,
    }
  )

  if (rejected.transfer.status !== "rejected") {
    console.error("Expected rejected transfer status.")
    process.exit(1)
  }

  console.log("Custody service verification passed.")
}

main()
