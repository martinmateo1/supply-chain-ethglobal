import { describe, expect, it } from "vitest"

import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import {
  mapCustodyTransferToTransfer,
  mapLotPayloadToLedgerLot,
  mapLotPositionToAsset,
  mapTransferPayloadToLedgerTransfer,
  partyHintFromId,
  toDamlCertification,
  toDamlCommodity,
  toDamlQualityGrade,
} from "@/lib/ledger/mappers"

const lotPayload = {
  owner: "production-site::abc",
  lotId: "lot-1",
  commodity: "Coffee",
  quantity: { amount: "100.0", unit: "tons" },
  certifications: ["NonGMO", "DeforestationFree"],
  quality: "GradeA",
  originIdentifier: "origin-huila-001",
  provenance: [],
}

const transferPayload = {
  transferId: "t-1",
  sender: "production-site::abc",
  receiver: "truck-transport::def",
  commodity: "Cacao",
  quantity: { amount: "40.5", unit: "tons" },
  certifications: ["DeforestationFree"],
  quality: "GradeB",
  originIdentifier: null,
  sourceLotId: "lot-1",
  evidenceHashes: ["0xabc", "0xdef"],
  provenance: [],
  status: "Pending",
}

describe("partyHintFromId", () => {
  it("extracts the operational node id before the namespace separator", () => {
    expect(partyHintFromId("production-site::1220abcd")).toBe("production-site")
  })

  it("returns the input unchanged when there is no separator", () => {
    expect(partyHintFromId("production-site")).toBe("production-site")
  })
})

describe("mapLotPositionToAsset", () => {
  it("maps a well-formed lot to a UI asset", () => {
    const lot = mapLotPayloadToLedgerLot("cid-1", lotPayload)
    const asset = mapLotPositionToAsset(lot, "production-site")
    expect(asset).toMatchObject({
      id: "cid-1",
      lotId: "lot-1",
      accountId: "production-site",
      commodity: "coffee",
      rating: "A",
      quantity: 100,
      unit: "tons",
      originIdentifier: "origin-huila-001",
    })
    expect(asset.certifications).toEqual(["non-gmo", "deforestation-free"])
  })

  it("throws on a non-numeric quantity rather than emitting NaN", () => {
    const lot = mapLotPayloadToLedgerLot("cid-2", {
      ...lotPayload,
      quantity: { amount: "not-a-number", unit: "tons" },
    })
    expect(() => mapLotPositionToAsset(lot, "production-site")).toThrowError(
      LedgerError,
    )
  })

  it("throws on an unrecognized commodity", () => {
    const lot = mapLotPayloadToLedgerLot("cid-3", {
      ...lotPayload,
      commodity: "Plutonium",
    })
    expect(() => mapLotPositionToAsset(lot, "production-site")).toThrowError(
      /commodity/,
    )
  })
})

describe("mapCustodyTransferToTransfer", () => {
  it("maps a pending transfer with evidence attachments", () => {
    const transfer = mapTransferPayloadToLedgerTransfer(
      "cid-t",
      transferPayload,
      "2026-06-13T12:00:00Z",
    )
    const result = mapCustodyTransferToTransfer(transfer)
    expect(result).toMatchObject({
      id: "t-1",
      fromAccountId: "production-site",
      toAccountId: "truck-transport",
      assetId: "lot-1",
      commodity: "cacao",
      rating: "B",
      quantity: 40.5,
      status: "pending",
      createdAt: "2026-06-13T12:00:00Z",
    })
    expect(result.attachments).toHaveLength(2)
    expect(result.attachments?.[0]).toMatchObject({ hash: "0xabc", name: "0xabc" })
    expect(result.sourceProvenanceRef).toBeUndefined()
  })

  it.each([
    ["Pending", "pending"],
    ["Rejected", "rejected"],
    ["Completed", "accepted"],
  ] as const)("maps ledger status %s to %s", (ledgerStatus, uiStatus) => {
    const transfer = mapTransferPayloadToLedgerTransfer("cid-x", {
      ...transferPayload,
      status: ledgerStatus,
    })
    expect(mapCustodyTransferToTransfer(transfer).status).toBe(uiStatus)
  })

  it("throws on an unknown transfer status instead of defaulting to accepted", () => {
    expect(() =>
      mapTransferPayloadToLedgerTransfer("cid-bad", {
        ...transferPayload,
        status: "Frozen",
      }),
    ).toThrowError(LedgerError)
  })

  it("tags the error with LEDGER_COMMAND_FAILED on corrupt data", () => {
    try {
      mapTransferPayloadToLedgerTransfer("cid-bad", {
        ...transferPayload,
        status: "Frozen",
      })
      expect.unreachable("expected a LedgerError")
    } catch (error) {
      expect(error).toBeInstanceOf(LedgerError)
      expect((error as LedgerError).code).toBe(
        LedgerErrorCode.LEDGER_COMMAND_FAILED,
      )
    }
  })
})

describe("toDaml encodings", () => {
  it("maps UI commodity to Daml enum", () => {
    expect(toDamlCommodity("coffee")).toBe("Coffee")
    expect(toDamlCommodity("cacao")).toBe("Cacao")
  })

  it("maps UI certification to Daml enum", () => {
    expect(toDamlCertification("non-gmo")).toBe("NonGMO")
    expect(toDamlCertification("deforestation-free")).toBe("DeforestationFree")
  })

  it("maps UI rating to Daml grade", () => {
    expect(toDamlQualityGrade("A")).toBe("GradeA")
    expect(toDamlQualityGrade("B")).toBe("GradeB")
    expect(toDamlQualityGrade("C")).toBe("GradeC")
  })
})
