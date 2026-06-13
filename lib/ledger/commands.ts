import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"

export type CreateLotCommand = {
  partyId: string
  commodity: "coffee" | "cacao"
  amount: string
  unit: string
  originIdentifier: string
  qualityGrade: "A" | "B" | "C"
  certifications: ("non-gmo" | "deforestation-free")[]
  originEvidenceHashes?: string[]
}

export type InitiateTransferCommand = {
  fromPartyId: string
  toPartyId: string
  lotPositionId: string
  amount: string
  unit: string
}

/**
 * Command construction for ledger workflows.
 * Browser code must not call these directly — use app/api/ledger/* routes.
 */
export const ledgerCommands = {
  createLot(_input: CreateLotCommand): never {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "createLot is not implemented until Canton contracts and gateway routes land (Epic 1.3+).",
    )
  },

  initiateTransfer(_input: InitiateTransferCommand): never {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "initiateTransfer is not implemented until Epic 2 custody transfer stories land.",
    )
  },
}
