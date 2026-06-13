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
  evidenceHashes?: string[]
}

export type AcceptTransferCommand = {
  partyId: string
  transferId: string
}

export type RejectTransferCommand = {
  partyId: string
  transferId: string
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
      "initiateTransfer Canton path is not wired — use app/api/ledger/initiate-transfer (demo adapter).",
    )
  },

  acceptTransfer(_input: AcceptTransferCommand): never {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "acceptTransfer Canton path is not wired — use app/api/ledger/accept-transfer (demo adapter).",
    )
  },

  rejectTransfer(_input: RejectTransferCommand): never {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "rejectTransfer Canton path is not wired — use app/api/ledger/reject-transfer (demo adapter).",
    )
  },
}
