import { describe, expect, it } from "vitest"

import {
  buildCustodyPathFromChain,
  mapLedgerProvenanceToCustodyChain,
} from "@/lib/ledger/custody-chain"
import type { Asset } from "@/lib/types"

describe("custody-chain", () => {
  it("maps ledger provenance into a custody chain with claim types", () => {
    const chain = mapLedgerProvenanceToCustodyChain([
      {
        fromParty: "production-site::abc",
        toParty: "production-site::abc",
        transferId: "lot-1",
        evidenceHashes: ["0xorigin"],
        occurredAt: "2026-06-01T00:00:00Z",
      },
      {
        fromParty: "production-site::abc",
        toParty: "truck-transport::def",
        transferId: "t-1",
        evidenceHashes: ["0xproof"],
        occurredAt: "2026-06-02T00:00:00Z",
      },
    ])

    expect(chain).toHaveLength(2)
    expect(chain[0]?.claimType).toBe("origin_attested")
    expect(chain[1]?.claimType).toBe("chain_of_custody_continuous")
  })

  it("builds a custody path from the carried chain", () => {
    const asset: Asset = {
      id: "cid-1",
      lotId: "lot-1",
      accountId: "truck-transport",
      commodity: "coffee",
      certifications: ["non-gmo"],
      rating: "A",
      quantity: 100,
      unit: "tons",
      custodyChain: [
        {
          fromAccountId: "production-site",
          toAccountId: "production-site",
          transferId: "lot-1",
          evidenceHashes: ["0xorigin"],
          occurredAt: "2026-06-01T00:00:00Z",
          claimType: "origin_attested",
        },
        {
          fromAccountId: "production-site",
          toAccountId: "truck-transport",
          transferId: "t-1",
          evidenceHashes: ["0xproof"],
          occurredAt: "2026-06-02T00:00:00Z",
          claimType: "chain_of_custody_continuous",
        },
      ],
    }

    const path = buildCustodyPathFromChain(asset)
    expect(path).toHaveLength(2)
    expect(path[0]?.accountId).toBe("production-site")
    expect(path[1]?.accountId).toBe("truck-transport")
    expect(path[1]?.evidenceHashes).toEqual(["0xproof"])
  })
})
