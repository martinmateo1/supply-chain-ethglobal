#!/usr/bin/env node
import {
  acceptTransfer,
  buildCustodyPath,
  initiateTransfer,
  type CustodySnapshot,
} from "@/lib/demo/custody-service"
import { isAssetVisibleToParty } from "@/lib/provenance"
import { NON_INVOLVED_PARTY_VIEW_ID } from "@/lib/demo/party-views"
import type { Asset, TransferAttachment } from "@/lib/types"

// The outbound multi-leg route from storage onward.
const ROUTE: string[] = [
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

function assetAt(snapshot: CustodySnapshot, accountId: string): Asset {
  const asset = snapshot.assets.find((a) => a.accountId === accountId)
  if (!asset) fail(`No lot position at ${accountId}`)
  return asset
}

function main() {
  const ROUTE_QUANTITY = 9_000

  const origin: Asset = {
    id: "a-route-origin",
    accountId: "silo",
    commodity: "coffee",
    certifications: ["non-gmo", "deforestation-free"],
    rating: "A",
    quantity: ROUTE_QUANTITY,
    unit: "tons",
    originIdentifier: "origin-huila-route",
    originEvidence: [
      {
        id: "ev-origin",
        name: "origin-cert.pdf",
        mimeType: "application/pdf",
        size: 2048,
        hash: "0xorigin-route",
      },
    ],
    sourceLotIds: [],
  }

  let snapshot: CustodySnapshot = { assets: [origin], transfers: [] }

  for (let i = 0; i < ROUTE.length - 1; i++) {
    const from = ROUTE[i]
    const to = ROUTE[i + 1]
    const source = assetAt(snapshot, from)
    const beforeQty = source.quantity

    // Bind per-leg evidence to exactly one leg to prove it stays leg-local.
    const attachments: TransferAttachment[] =
      to === "origin-port"
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
      quantity: beforeQty,
      attachments,
    })

    const accepted = acceptTransfer(pending, {
      partyViewId: to,
      transferId: pending.transfer.id,
    })

    snapshot = { assets: accepted.assets, transfers: accepted.transfers }

    // Conservation: destination holds the full quantity, source is archived.
    const dest = assetAt(snapshot, to)
    if (dest.quantity !== beforeQty) {
      fail(`Conservation broken ${from}→${to}: ${dest.quantity} != ${beforeQty}`)
    }
    if (snapshot.assets.some((a) => a.accountId === from)) {
      fail(`Source ${from} should be archived after full transfer`)
    }
    // Provenance continuity across legs.
    if (dest.commodity !== "coffee") fail(`Commodity lost at ${to}`)
    if (dest.certifications.length !== 2) fail(`Certifications lost at ${to}`)
    if (dest.originIdentifier !== "origin-huila-route") {
      fail(`Origin identifier lost at ${to}`)
    }
    if (!dest.sourceLotIds?.includes("a-route-origin")) {
      fail(`Provenance link to origin lost at ${to}`)
    }
    console.log(`✓ ${from} → ${to}: ${dest.quantity}t conserved, provenance intact`)
  }

  // Custody path covers the full route in order.
  const finalAsset = assetAt(snapshot, "destination-port")
  const path = buildCustodyPath(finalAsset, snapshot.transfers)
  const pathNodes = path.map((step) => step.accountId)
  if (JSON.stringify(pathNodes) !== JSON.stringify(ROUTE)) {
    fail(`Custody path ${JSON.stringify(pathNodes)} != route ${JSON.stringify(ROUTE)}`)
  }
  console.log(`✓ Custody path: ${pathNodes.join(" → ")}`)

  // Per-leg evidence binding: only the origin-port leg carries leg evidence.
  const originPortStep = path.find((step) => step.accountId === "origin-port")
  if (!originPortStep?.evidenceHashes.includes("0xleg-origin-port")) {
    fail("origin-port leg should carry its bound evidence")
  }
  for (const step of path) {
    if (step.accountId === "origin-port") continue
    if (step.evidenceHashes.includes("0xleg-origin-port")) {
      fail(`Evidence leaked onto ${step.accountId} leg`)
    }
  }
  console.log("✓ Evidence stays bound to the origin-port leg only")

  // Non-involved company sees nothing private on this route.
  if (isAssetVisibleToParty(finalAsset, NON_INVOLVED_PARTY_VIEW_ID, snapshot.transfers)) {
    fail("Non-involved company must not see route holdings")
  }
  console.log("✓ Non-involved company sees no private route data")

  console.log("Multi-leg route verification passed.")
}

main()
