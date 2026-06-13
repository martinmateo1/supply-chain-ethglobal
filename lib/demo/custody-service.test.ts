import { describe, expect, it } from "vitest"

import {
  acceptTransfer,
  assertNoDoubleSpend,
  availableQuantityForAsset,
  buildCustodyPath,
  buildProvenanceTimeline,
  combineLots,
  initiateTransfer,
  isPartialTransfer,
  lotsAreCompatible,
  splitConservation,
  type CustodySnapshot,
} from "@/lib/demo/custody-service"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import type { Asset, Transfer } from "@/lib/types"

function siloSource(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "a-src",
    accountId: "production-site",
    commodity: "coffee",
    certifications: ["non-gmo", "deforestation-free"],
    rating: "A",
    quantity: 12_500,
    unit: "tons",
    originIdentifier: "origin-huila-001",
    originEvidence: [
      {
        id: "ev-1",
        name: "origin-cert.pdf",
        mimeType: "application/pdf",
        size: 1024,
        hash: "0xorigin",
      },
    ],
    ...overrides,
  }
}

function baseSnapshot(assets: Asset[]): CustodySnapshot {
  return { assets, transfers: [] }
}

describe("splitConservation", () => {
  it("conserves quantity exactly on a partial split (12,500 → 4,000)", () => {
    const result = splitConservation(12_500, 4_000)
    expect(result).toEqual({ before: 12_500, transferred: 4_000, remaining: 8_500 })
    expect(result.transferred + result.remaining).toBe(result.before)
  })

  it("treats a full transfer as a zero-remainder split", () => {
    expect(splitConservation(12_500, 12_500)).toEqual({
      before: 12_500,
      transferred: 12_500,
      remaining: 0,
    })
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid transfer amount %s",
    (amount) => {
      expect(() => splitConservation(12_500, amount)).toThrowError(LedgerError)
    }
  )

  it("rejects a transfer larger than the source", () => {
    expect(() => splitConservation(1_000, 1_001)).toThrowError(LedgerError)
  })
})

describe("isPartialTransfer", () => {
  it("is true when moving less than available", () => {
    expect(isPartialTransfer(4_000, 12_500)).toBe(true)
  })
  it("is false for a full transfer", () => {
    expect(isPartialTransfer(12_500, 12_500)).toBe(false)
  })
  it("is false for non-positive amounts", () => {
    expect(isPartialTransfer(0, 12_500)).toBe(false)
  })
})

describe("initiateTransfer (split)", () => {
  it("reserves the partial quantity and reduces availability", () => {
    const source = siloSource()
    const snapshot = baseSnapshot([source])

    const result = initiateTransfer(snapshot, {
      partyViewId: "production-site",
      fromAccountId: "production-site",
      toAccountId: "truck-transport",
      assetId: source.id,
      quantity: 4_000,
    })

    expect(result.transfer.quantity).toBe(4_000)
    expect(availableQuantityForAsset(source, result.transfers)).toBe(8_500)
  })

  it.each([0, -50])("blocks invalid quantity %s with a conservation message", (amount) => {
    const source = siloSource()
    try {
      initiateTransfer(baseSnapshot([source]), {
        partyViewId: "production-site",
        fromAccountId: "production-site",
        toAccountId: "truck-transport",
        assetId: source.id,
        quantity: amount,
      })
      expect.unreachable("expected a LedgerError")
    } catch (error) {
      expect(error).toBeInstanceOf(LedgerError)
      expect((error as LedgerError).message).toMatch(/conserve|greater than zero/i)
    }
  })

  it("blocks a transfer greater than available", () => {
    const source = siloSource()
    expect(() =>
      initiateTransfer(baseSnapshot([source]), {
        partyViewId: "production-site",
        fromAccountId: "production-site",
        toAccountId: "truck-transport",
        assetId: source.id,
        quantity: 13_000,
      })
    ).toThrowError(LedgerError)
  })
})

describe("acceptTransfer (split application)", () => {
  it("conserves quantity: child + remaining equals the source", () => {
    const source = siloSource()
    const pending = initiateTransfer(baseSnapshot([source]), {
      partyViewId: "production-site",
      fromAccountId: "production-site",
      toAccountId: "truck-transport",
      assetId: source.id,
      quantity: 4_000,
    })

    const accepted = acceptTransfer(pending, {
      partyViewId: "truck-transport",
      transferId: pending.transfer.id,
    })

    const remainingSource = accepted.assets.find((a) => a.id === source.id)
    const child = accepted.assets.find(
      (a) => a.accountId === "truck-transport"
    )

    expect(remainingSource?.quantity).toBe(8_500)
    expect(child?.quantity).toBe(4_000)
    expect((remainingSource?.quantity ?? 0) + (child?.quantity ?? 0)).toBe(12_500)
  })

  it("archives the source on a full transfer", () => {
    const source = siloSource()
    const pending = initiateTransfer(baseSnapshot([source]), {
      partyViewId: "production-site",
      fromAccountId: "production-site",
      toAccountId: "truck-transport",
      assetId: source.id,
      quantity: 12_500,
    })

    const accepted = acceptTransfer(pending, {
      partyViewId: "truck-transport",
      transferId: pending.transfer.id,
    })

    expect(accepted.assets.find((a) => a.id === source.id)).toBeUndefined()
    const child = accepted.assets.find((a) => a.accountId === "truck-transport")
    expect(child?.quantity).toBe(12_500)
  })

  it("preserves commodity, certifications, origin and derived provenance on the child", () => {
    const source = siloSource()
    const pending = initiateTransfer(baseSnapshot([source]), {
      partyViewId: "production-site",
      fromAccountId: "production-site",
      toAccountId: "truck-transport",
      assetId: source.id,
      quantity: 4_000,
    })

    const accepted = acceptTransfer(pending, {
      partyViewId: "truck-transport",
      transferId: pending.transfer.id,
    })

    const child = accepted.assets.find((a) => a.accountId === "truck-transport")
    expect(child?.commodity).toBe("coffee")
    expect(child?.certifications).toEqual(["non-gmo", "deforestation-free"])
    expect(child?.rating).toBe("A")
    expect(child?.originIdentifier).toBe("origin-huila-001")
    expect(child?.originEvidence?.[0]?.hash).toBe("0xorigin")
    // Derived reference back to the source lot for attestation traceability.
    expect(child?.sourceLotIds).toContain("a-src")
    expect(pending.transfer.sourceProvenanceRef).toBeDefined()
  })
})

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

describe("lotsAreCompatible", () => {
  it("is compatible for identical commodity, certs, and rating", () => {
    expect(lotsAreCompatible(siloLot("a"), siloLot("b"))).toEqual({
      compatible: true,
    })
  })

  it("ignores certification order", () => {
    const a = siloLot("a", { certifications: ["non-gmo", "deforestation-free"] })
    const b = siloLot("b", { certifications: ["deforestation-free", "non-gmo"] })
    expect(lotsAreCompatible(a, b).compatible).toBe(true)
  })

  it("rejects different commodities with a reason", () => {
    const result = lotsAreCompatible(siloLot("a"), siloLot("b", { commodity: "cacao" }))
    expect(result.compatible).toBe(false)
    if (!result.compatible) expect(result.reason).toMatch(/commodit/i)
  })

  it("rejects different certification sets with a reason", () => {
    const result = lotsAreCompatible(
      siloLot("a"),
      siloLot("b", { certifications: ["non-gmo"] })
    )
    expect(result.compatible).toBe(false)
    if (!result.compatible) expect(result.reason).toMatch(/certification/i)
  })

  it("rejects different ratings with a reason", () => {
    const result = lotsAreCompatible(siloLot("a"), siloLot("b", { rating: "B" }))
    expect(result.compatible).toBe(false)
    if (!result.compatible) expect(result.reason).toMatch(/rating/i)
  })
})

describe("combineLots", () => {
  it("sums quantities exactly and preserves provenance + certs", () => {
    const a = siloLot("a", { quantity: 1_000, sourceLotIds: ["x"] })
    const b = siloLot("b", { quantity: 2_500, sourceLotIds: ["y"] })
    const snapshot = baseSnapshot([a, b])

    const result = combineLots(snapshot, {
      partyViewId: "silo",
      accountId: "silo",
      lotIds: ["a", "b"],
    })

    expect(result.asset.quantity).toBe(3_500)
    expect(result.asset.commodity).toBe("coffee")
    expect(result.asset.certifications).toEqual(["non-gmo", "deforestation-free"])
    expect(result.asset.rating).toBe("A")
    // Provenance: union of prior source ids plus the two combined lot ids.
    expect(result.asset.sourceLotIds).toEqual(
      expect.arrayContaining(["x", "y", "a", "b"])
    )
    // Sources are consumed.
    expect(result.assets.find((lot) => lot.id === "a")).toBeUndefined()
    expect(result.assets.find((lot) => lot.id === "b")).toBeUndefined()
    expect(result.assets).toContainEqual(result.asset)
  })

  it("conserves quantity: combined equals the sum of sources", () => {
    const lots = [
      siloLot("a", { quantity: 1_111 }),
      siloLot("b", { quantity: 2_222 }),
      siloLot("c", { quantity: 3_333 }),
    ]
    const result = combineLots(baseSnapshot(lots), {
      partyViewId: "silo",
      accountId: "silo",
      lotIds: ["a", "b", "c"],
    })
    expect(result.asset.quantity).toBe(6_666)
  })

  it("merges origin evidence without duplicating hashes", () => {
    const a = siloLot("a", {
      originEvidence: [
        { id: "e1", name: "c.pdf", mimeType: "application/pdf", size: 1, hash: "0xaa" },
      ],
    })
    const b = siloLot("b", {
      originEvidence: [
        { id: "e1b", name: "c.pdf", mimeType: "application/pdf", size: 1, hash: "0xaa" },
        { id: "e2", name: "d.pdf", mimeType: "application/pdf", size: 1, hash: "0xbb" },
      ],
    })
    const result = combineLots(baseSnapshot([a, b]), {
      partyViewId: "silo",
      accountId: "silo",
      lotIds: ["a", "b"],
    })
    expect(result.asset.originEvidence?.map((e) => e.hash)).toEqual(["0xaa", "0xbb"])
  })

  it("rejects incompatible commodities, leaving sources intact", () => {
    const a = siloLot("a")
    const b = siloLot("b", { commodity: "cacao" })
    const snapshot = baseSnapshot([a, b])
    expect(() =>
      combineLots(snapshot, {
        partyViewId: "silo",
        accountId: "silo",
        lotIds: ["a", "b"],
      })
    ).toThrowError(LedgerError)
    // Snapshot is not mutated.
    expect(snapshot.assets).toHaveLength(2)
  })

  it("rejects incompatible certification sets", () => {
    const a = siloLot("a")
    const b = siloLot("b", { certifications: ["non-gmo"] })
    expect(() =>
      combineLots(baseSnapshot([a, b]), {
        partyViewId: "silo",
        accountId: "silo",
        lotIds: ["a", "b"],
      })
    ).toThrowError(LedgerError)
  })

  it("requires at least two lots", () => {
    expect(() =>
      combineLots(baseSnapshot([siloLot("a")]), {
        partyViewId: "silo",
        accountId: "silo",
        lotIds: ["a"],
      })
    ).toThrowError(LedgerError)
  })

  it("rejects when the party view does not own the node", () => {
    const a = siloLot("a")
    const b = siloLot("b")
    expect(() =>
      combineLots(baseSnapshot([a, b]), {
        partyViewId: "truck-transport",
        accountId: "silo",
        lotIds: ["a", "b"],
      })
    ).toThrowError(LedgerError)
  })

  it("rejects when a lot is reserved by a pending transfer", () => {
    const a = siloLot("a")
    const b = siloLot("b")
    const snapshot: CustodySnapshot = {
      assets: [a, b],
      transfers: [
        {
          id: "t1",
          assetId: "a",
          fromAccountId: "silo",
          toAccountId: "railway-transport",
          commodity: "coffee",
          certifications: ["non-gmo", "deforestation-free"],
          rating: "A",
          quantity: 500,
          unit: "tons",
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ],
    }
    expect(() =>
      combineLots(snapshot, {
        partyViewId: "silo",
        accountId: "silo",
        lotIds: ["a", "b"],
      })
    ).toThrowError(LedgerError)
  })
})

describe("buildCustodyPath (multi-leg)", () => {
  function leg(
    id: string,
    from: string,
    to: string,
    overrides: { attachmentsHash?: string; occurredAt?: string } = {}
  ): Transfer {
    return {
      id,
      fromAccountId: from,
      toAccountId: to,
      commodity: "coffee",
      certifications: ["non-gmo", "deforestation-free"],
      rating: "A",
      quantity: 9_000,
      unit: "tons",
      status: "accepted",
      createdAt: overrides.occurredAt ?? "2026-01-01T00:00:00.000Z",
      occurredAt: overrides.occurredAt,
      attachments: overrides.attachmentsHash
        ? [
            {
              id: `att-${id}`,
              name: `${id}.pdf`,
              mimeType: "application/pdf",
              size: 1,
              hash: overrides.attachmentsHash,
            },
          ]
        : undefined,
    }
  }

  it("returns the origin-only path when there are no accepted legs", () => {
    const asset = siloLot("a", { quantity: 1_000 })
    const path = buildCustodyPath(asset, [])
    expect(path).toHaveLength(1)
    expect(path[0]?.accountId).toBe("silo")
    expect(path[0]?.transferId).toBeNull()
  })

  it("orders the full route by custody position regardless of input order", () => {
    const finalAsset = siloLot("final", { accountId: "destination-port" })
    const transfers = [
      leg("t3", "origin-port", "ship"),
      leg("t1", "silo", "railway-transport"),
      leg("t4", "ship", "destination-port"),
      leg("t2", "railway-transport", "origin-port"),
    ]
    const path = buildCustodyPath(finalAsset, transfers)
    expect(path.map((s) => s.accountId)).toEqual([
      "silo",
      "railway-transport",
      "origin-port",
      "ship",
      "destination-port",
    ])
  })

  it("keeps evidence bound to the leg it was attached to", () => {
    const finalAsset = siloLot("final", { accountId: "origin-port" })
    const transfers = [
      leg("t1", "silo", "railway-transport"),
      leg("t2", "railway-transport", "origin-port", { attachmentsHash: "0xleg2" }),
    ]
    const path = buildCustodyPath(finalAsset, transfers)
    const originPort = path.find((s) => s.accountId === "origin-port")
    const railway = path.find((s) => s.accountId === "railway-transport")
    expect(originPort?.evidenceHashes).toContain("0xleg2")
    expect(railway?.evidenceHashes ?? []).not.toContain("0xleg2")
  })
})

describe("assertNoDoubleSpend", () => {
  it("allows a request within the available balance", () => {
    const asset = siloLot("a", { quantity: 1_000 })
    expect(() => assertNoDoubleSpend(asset, [], 1_000)).not.toThrow()
  })

  it("blocks spending reserved quantity as a DOUBLE_SPEND", () => {
    const asset = siloLot("a", { quantity: 1_000 })
    const transfers: Transfer[] = [
      {
        id: "t-pending",
        assetId: "a",
        fromAccountId: "silo",
        toAccountId: "railway-transport",
        commodity: "coffee",
        certifications: ["non-gmo", "deforestation-free"],
        rating: "A",
        quantity: 600,
        unit: "tons",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ]
    // 1000 - 600 reserved = 400 available; requesting 500 is a double-spend.
    try {
      assertNoDoubleSpend(asset, transfers, 500)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(LedgerError)
      expect((error as LedgerError).code).toBe(LedgerErrorCode.DOUBLE_SPEND)
    }
  })

  it("classifies a plain over-amount (nothing reserved) as INSUFFICIENT_QUANTITY", () => {
    const asset = siloLot("a", { quantity: 1_000 })
    try {
      assertNoDoubleSpend(asset, [], 1_500)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(LedgerError)
      expect((error as LedgerError).code).toBe(
        LedgerErrorCode.INSUFFICIENT_QUANTITY
      )
    }
  })

  it("blocks re-spending more than remains after a prior split", () => {
    const source = siloLot("a", { quantity: 1_000 })
    const afterSplit = initiateTransfer(
      { assets: [source], transfers: [] },
      {
        partyViewId: "silo",
        fromAccountId: "silo",
        toAccountId: "railway-transport",
        assetId: "a",
        quantity: 700,
      }
    )
    // 700 is now reserved → only 300 remains. A 400 transfer must be rejected.
    expect(() =>
      initiateTransfer(
        { assets: afterSplit.assets, transfers: afterSplit.transfers },
        {
          partyViewId: "silo",
          fromAccountId: "silo",
          toAccountId: "origin-port",
          assetId: "a",
          quantity: 400,
        }
      )
    ).toThrowError(LedgerError)
  })

  it("blocks combining a lot reserved by a pending transfer", () => {
    const a = siloLot("a")
    const b = siloLot("b")
    const snapshot: CustodySnapshot = {
      assets: [a, b],
      transfers: [
        {
          id: "t-pending",
          assetId: "a",
          fromAccountId: "silo",
          toAccountId: "railway-transport",
          commodity: "coffee",
          certifications: ["non-gmo", "deforestation-free"],
          rating: "A",
          quantity: 100,
          unit: "tons",
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ],
    }
    expect(() =>
      combineLots(snapshot, {
        partyViewId: "silo",
        accountId: "silo",
        lotIds: ["a", "b"],
      })
    ).toThrowError(LedgerError)
  })
})

describe("buildProvenanceTimeline", () => {
  it("emits an origin-only timeline for a fresh lot", () => {
    const asset = siloLot("a", { quantity: 1_000 })
    const timeline = buildProvenanceTimeline(asset, { assets: [asset], transfers: [] })
    expect(timeline).toHaveLength(1)
    expect(timeline[0]?.operationType).toBe("origin")
    expect(timeline[0]?.conserved).toBe(true)
  })

  it("classifies a freshly combined lot as a combine origin with source refs", () => {
    const combined = siloLot("combined", {
      quantity: 2_000,
      sourceLotIds: ["a", "b"],
    })
    const timeline = buildProvenanceTimeline(combined, {
      assets: [combined],
      transfers: [],
    })
    expect(timeline[0]?.operationType).toBe("combine")
    expect(timeline[0]?.sourceRefs).toEqual(["a", "b"])
    expect(timeline[0]?.derivedRefs).toEqual(["combined"])
  })

  it("marks a partial outbound leg as a split with conservation arithmetic", () => {
    // The remainder still sits at the silo, so the leg is a split.
    const remainder = siloLot("a-remainder", { quantity: 300 })
    const moved = siloLot("a-moved", {
      accountId: "railway-transport",
      quantity: 700,
    })
    const transfers: Transfer[] = [
      {
        id: "t1",
        assetId: "a",
        fromAccountId: "silo",
        toAccountId: "railway-transport",
        commodity: "coffee",
        certifications: ["non-gmo", "deforestation-free"],
        rating: "A",
        quantity: 700,
        unit: "tons",
        status: "accepted",
        createdAt: "2026-01-01T00:00:00.000Z",
        occurredAt: "2026-01-01T01:00:00.000Z",
      },
    ]
    const timeline = buildProvenanceTimeline(
      moved,
      { assets: [remainder, moved], transfers },
      transfers
    )
    const leg = timeline.find((e) => e.transferId === "t1")
    expect(leg?.operationType).toBe("split")
    expect(leg?.quantity).toBe(700)
    expect(leg?.afterQuantity).toBe(300)
    expect(leg?.beforeQuantity).toBe(1_000)
    expect(leg?.conserved).toBe(true)
  })

  it("marks a full outbound leg as a transfer (no remainder at source)", () => {
    const moved = siloLot("a-moved", {
      accountId: "railway-transport",
      quantity: 1_000,
    })
    const transfers: Transfer[] = [
      {
        id: "t1",
        assetId: "a",
        fromAccountId: "silo",
        toAccountId: "railway-transport",
        commodity: "coffee",
        certifications: ["non-gmo", "deforestation-free"],
        rating: "A",
        quantity: 1_000,
        unit: "tons",
        status: "accepted",
        createdAt: "2026-01-01T00:00:00.000Z",
        occurredAt: "2026-01-01T01:00:00.000Z",
      },
    ]
    const timeline = buildProvenanceTimeline(
      moved,
      { assets: [moved], transfers },
      transfers
    )
    const leg = timeline.find((e) => e.transferId === "t1")
    expect(leg?.operationType).toBe("transfer")
    expect(leg?.afterQuantity).toBe(0)
  })
})
