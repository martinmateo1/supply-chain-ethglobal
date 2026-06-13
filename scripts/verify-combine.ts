#!/usr/bin/env node
import { combineLots, lotsAreCompatible } from "@/lib/demo/custody-service"
import type { Asset } from "@/lib/types"

function siloLot(id: string, overrides: Partial<Asset> = {}): Asset {
  return {
    id,
    accountId: "silo",
    commodity: "coffee",
    certifications: ["non-gmo", "deforestation-free"],
    rating: "A",
    quantity: 1_000,
    unit: "tons",
    ...overrides,
  }
}

function main() {
  const a = siloLot("a", { quantity: 1_000, sourceLotIds: ["x"] })
  const b = siloLot("b", { quantity: 2_500 })

  // Compatible combine sums quantities and preserves provenance.
  const combined = combineLots(
    { assets: [a, b], transfers: [] },
    { partyViewId: "silo", accountId: "silo", lotIds: ["a", "b"] }
  )

  if (combined.asset.quantity !== 3_500) {
    console.error(`Expected combined 3,500t, got ${combined.asset.quantity}`)
    process.exit(1)
  }
  if (!combined.asset.sourceLotIds?.includes("a") || !combined.asset.sourceLotIds?.includes("b")) {
    console.error("Expected source lot ids preserved on combined lot.")
    process.exit(1)
  }
  console.log("Compatible combine conserved quantity and preserved provenance.")

  // Incompatible commodity must be rejected.
  const incompatible = lotsAreCompatible(siloLot("c"), siloLot("d", { commodity: "cacao" }))
  if (incompatible.compatible) {
    console.error("Different commodities should be incompatible.")
    process.exit(1)
  }

  try {
    combineLots(
      { assets: [siloLot("c"), siloLot("d", { commodity: "cacao" })], transfers: [] },
      { partyViewId: "silo", accountId: "silo", lotIds: ["c", "d"] }
    )
    console.error("Incompatible combine should have failed.")
    process.exit(1)
  } catch {
    console.log("Incompatible combine blocked as expected.")
  }

  // Unauthorized party view cannot combine.
  try {
    combineLots(
      { assets: [siloLot("e"), siloLot("f")], transfers: [] },
      { partyViewId: "truck-transport", accountId: "silo", lotIds: ["e", "f"] }
    )
    console.error("Unauthorized combine should have failed.")
    process.exit(1)
  } catch {
    console.log("Unauthorized combine blocked as expected.")
  }

  console.log("Combine verification passed.")
}

main()
