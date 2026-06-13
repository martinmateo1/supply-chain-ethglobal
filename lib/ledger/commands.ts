import {
  cantonAcceptTransfer,
  cantonInitiateTransfer,
  cantonRejectTransfer,
} from "@/lib/ledger/canton-custody-service"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import type { InitiateTransferRequest, TransferActionRequest } from "@/lib/demo/custody-service"

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

export type InitiateTransferCommand = InitiateTransferRequest
export type AcceptTransferCommand = TransferActionRequest
export type RejectTransferCommand = TransferActionRequest

export const ledgerCommands = {
  // Intentionally unimplemented on the Canton path: origin lots are provisioned
  // via SetupDemo seeding, and the UI's create-lot panel is hidden when
  // LEDGER_BACKEND=canton (see traceability-view `canCreateLot`). Wiring this to
  // a Daml `create LotPosition` command is tracked as Epic 5 follow-up.
  createLot(_input: CreateLotCommand): never {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Creating lots on the Canton ledger is not available yet. Origin lots are provisioned via SetupDemo seeding.",
    )
  },
  initiateTransfer: cantonInitiateTransfer,
  acceptTransfer: cantonAcceptTransfer,
  rejectTransfer: cantonRejectTransfer,
}
