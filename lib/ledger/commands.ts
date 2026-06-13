import {
  cantonAcceptTransfer,
  cantonCreateLot,
  cantonInitiateTransfer,
  cantonRejectTransfer,
} from "@/lib/ledger/canton-custody-service"
import type {
  CreateLotRequest,
  InitiateTransferRequest,
  TransferActionRequest,
} from "@/lib/demo/custody-service"

export type CreateLotCommand = CreateLotRequest

export type InitiateTransferCommand = InitiateTransferRequest
export type AcceptTransferCommand = TransferActionRequest
export type RejectTransferCommand = TransferActionRequest

export const ledgerCommands = {
  createLot: cantonCreateLot,
  initiateTransfer: cantonInitiateTransfer,
  acceptTransfer: cantonAcceptTransfer,
  rejectTransfer: cantonRejectTransfer,
}
