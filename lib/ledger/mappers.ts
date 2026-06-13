import type { Asset, Transfer } from "@/lib/types"

/**
 * Translates Daml/generated ledger types into UI-facing domain types.
 * Generated bindings will live under lib/ledger/generated/ once daml build runs.
 */

export type GeneratedLotPosition = {
  contractId: string
  owner: string
  commodity: string
  amount: string
  unit: string
}

export function mapLotPositionToAsset(
  lot: GeneratedLotPosition,
  accountId: string,
): Asset {
  return {
    id: lot.contractId,
    accountId,
    commodity: lot.commodity === "Cacao" ? "cacao" : "coffee",
    certifications: [],
    rating: "A",
    quantity: Number.parseFloat(lot.amount),
    unit: "tons",
  }
}

export function mapCustodyTransferToTransfer(
  _ledgerTransfer: unknown,
): Transfer {
  throw new Error(
    "mapCustodyTransferToTransfer is a stub until generated bindings exist.",
  )
}
