#!/usr/bin/env tsx
import { cantonCreateLot } from "../lib/ledger/canton-custody-service"

async function main() {
  const result = await cantonCreateLot({
    partyViewId: "production-site",
    accountId: "production-site",
    commodity: "coffee",
    quantity: 42,
    rating: "A",
    certifications: ["non-gmo"],
    originIdentifier: "test-origin-001",
  })
  console.log(
    `Canton create lot verified: ${result.asset.id} (${result.asset.quantity}t)`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
