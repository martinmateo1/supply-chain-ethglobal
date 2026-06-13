import { isCantonBackend } from "@/lib/ledger/backend"
import {
  acceptTransfer as demoAcceptTransfer,
  initiateTransfer as demoInitiateTransfer,
  nextDemoAssetId,
  rejectTransfer as demoRejectTransfer,
  transferHistoryForParty,
  type CreateLotRequest,
  type CustodySnapshot,
  type InitiateTransferRequest,
  type TransferActionRequest,
} from "@/lib/demo/custody-service"
import {
  assertOriginLotProducer,
  operationalNodeForPartyView,
} from "@/lib/demo/party-view-auth"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import { ledgerCommands } from "@/lib/ledger/commands"
import { ledgerQueries } from "@/lib/ledger/queries"

export async function gatewayInitiateTransfer(
  snapshot: CustodySnapshot,
  input: InitiateTransferRequest,
) {
  if (isCantonBackend()) {
    return ledgerCommands.initiateTransfer(input)
  }
  return demoInitiateTransfer(snapshot, input)
}

export async function gatewayAcceptTransfer(
  snapshot: CustodySnapshot,
  input: TransferActionRequest,
) {
  if (isCantonBackend()) {
    return ledgerCommands.acceptTransfer(input)
  }
  return demoAcceptTransfer(snapshot, input)
}

export async function gatewayRejectTransfer(
  snapshot: CustodySnapshot,
  input: TransferActionRequest,
) {
  if (isCantonBackend()) {
    return ledgerCommands.rejectTransfer(input)
  }
  return demoRejectTransfer(snapshot, input)
}

export async function gatewayTransferHistory(
  snapshot: CustodySnapshot,
  partyViewId: string,
) {
  if (isCantonBackend()) {
    return ledgerQueries.transferHistory({ partyViewId })
  }
  const nodeId = operationalNodeForPartyView(partyViewId)
  return transferHistoryForParty(snapshot, partyViewId, nodeId)
}

export async function gatewayVisibleHoldings(partyViewId: string) {
  if (isCantonBackend()) {
    return ledgerQueries.visibleHoldings({ partyViewId })
  }
  return null
}

export async function gatewayCreateLot(
  snapshot: CustodySnapshot,
  input: CreateLotRequest,
) {
  if (isCantonBackend()) {
    return ledgerCommands.createLot(input)
  }

  assertOriginLotProducer(input.partyViewId, input.accountId)

  const originIdentifier = input.originIdentifier.trim()
  if (!originIdentifier || !input.certifications.length) {
    throw new LedgerError(
      LedgerErrorCode.EVIDENCE_REFERENCE_INVALID,
      "Origin identifier and at least one certification are required.",
    )
  }

  const asset = {
    id: nextDemoAssetId(),
    accountId: input.accountId,
    commodity: input.commodity,
    certifications: input.certifications,
    rating: input.rating,
    quantity: input.quantity,
    unit: "tons" as const,
    originIdentifier,
    ...(input.attachments?.length
      ? {
          originEvidence: input.attachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            mimeType: attachment.mimeType,
            size: attachment.size,
            hash: attachment.hash,
            documentType: attachment.mimeType.split("/")[1] ?? "document",
            timestamp: new Date().toISOString(),
          })),
        }
      : {}),
  }

  return {
    assets: [...snapshot.assets, asset],
    transfers: snapshot.transfers,
    asset,
  }
}
