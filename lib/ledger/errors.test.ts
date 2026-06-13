import { describe, expect, it } from "vitest"

import { LedgerErrorCode, mapCantonError } from "@/lib/ledger/errors"

describe("mapCantonError", () => {
  it("maps HTTP 503 to LEDGER_UNAVAILABLE", () => {
    expect(mapCantonError("Service down", 503).code).toBe(
      LedgerErrorCode.LEDGER_UNAVAILABLE,
    )
  })

  it("maps an 'unavailable' body to LEDGER_UNAVAILABLE", () => {
    expect(
      mapCantonError("UNAVAILABLE: synchronizer not connected", 500).code,
    ).toBe(LedgerErrorCode.LEDGER_UNAVAILABLE)
  })

  it("maps contention/concurrency to LEDGER_CONTENTION", () => {
    expect(
      mapCantonError("LOCAL_VERDICT_LOCKED_CONTRACTS contention", 409).code,
    ).toBe(LedgerErrorCode.LEDGER_CONTENTION)
  })

  it("maps insufficient quantity to INSUFFICIENT_QUANTITY", () => {
    expect(
      mapCantonError("Interpretation failed: Insufficient quantity", 400).code,
    ).toBe(LedgerErrorCode.INSUFFICIENT_QUANTITY)
  })

  it("maps positive-amount assertion to INSUFFICIENT_QUANTITY", () => {
    expect(
      mapCantonError("Transfer amount must be positive", 400).code,
    ).toBe(LedgerErrorCode.INSUFFICIENT_QUANTITY)
  })

  it("maps a consumed/not-found contract to SOURCE_ASSET_ALREADY_CONSUMED", () => {
    expect(mapCantonError("CONTRACT_NOT_FOUND", 404).code).toBe(
      LedgerErrorCode.SOURCE_ASSET_ALREADY_CONSUMED,
    )
    expect(
      mapCantonError("contract was already consumed", 400).code,
    ).toBe(LedgerErrorCode.SOURCE_ASSET_ALREADY_CONSUMED)
  })

  it("maps authorization failures to UNAUTHORIZED_PARTY_VIEW", () => {
    expect(mapCantonError("permission denied", 403).code).toBe(
      LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
    )
    expect(mapCantonError("requires authorizers", 400).code).toBe(
      LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
    )
  })

  it("falls back to LEDGER_COMMAND_FAILED and preserves a truncated body", () => {
    const body = "x".repeat(900)
    const error = mapCantonError(body, 400)
    expect(error.code).toBe(LedgerErrorCode.LEDGER_COMMAND_FAILED)
    expect(typeof error.details).toBe("string")
    expect((error.details as string).length).toBe(500)
  })
})
