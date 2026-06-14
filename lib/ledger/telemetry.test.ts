import { describe, expect, it } from "vitest"

import {
  displayLedgerHost,
  formatCommandLine,
  formatOffsetTick,
  formatTelemetryHeaderLines,
  truncatePackageId,
} from "@/lib/ledger/telemetry"

describe("ledger telemetry formatting", () => {
  const at = new Date("2026-06-13T12:34:01.000Z")

  it("truncates long package ids for display", () => {
    const id = "48c08b5fdedad07e9f4d8033732fa5d36714e2eec849b8b58c112bb2aa5da096"
    expect(truncatePackageId(id)).toBe("48c08b5f…5da096")
    expect(truncatePackageId("short-id")).toBe("short-id")
  })

  it("formats offset ticks", () => {
    expect(formatOffsetTick("112", "113", at)).toMatch(/offset 112 → 113/)
  })

  it("formats Daml choice lines", () => {
    expect(
      formatCommandLine("InitiateTransfer", "LotPosition", "production-site", at),
    ).toMatch(/Exercise InitiateTransfer · LotPosition · production-site/)
  })

  it("builds telemetry header lines", () => {
    const lines = formatTelemetryHeaderLines({
      ledgerEndOffset: "113",
      activeContractCount: 42,
      partyCount: 7,
      packageId: "48c08b5fdedad07e9f4d8033732fa5d36714e2eec849b8b58c112bb2aa5da096",
      ledgerId: "sandbox",
      ledgerHost: "http://localhost:6864",
    })

    expect(lines[0]).toBe("canton://sandbox @ localhost:6864")
    expect(lines[1]).toContain("commodity-traceability")
    expect(lines[2]).toBe("parties: 7 · acs: 42 · offset: 113")
    expect(lines[3]).toBe("—")
  })

  it("strips protocol from ledger host display", () => {
    expect(displayLedgerHost("http://localhost:6864")).toBe("localhost:6864")
  })
})
