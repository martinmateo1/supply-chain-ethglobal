import { isCantonBackend } from "@/lib/ledger/backend"
import {
  acceptTransfer as demoAcceptTransfer,
  initiateTransfer as demoInitiateTransfer,
  rejectTransfer as demoRejectTransfer,
  transferHistoryForParty,
  type CustodySnapshot,
  type InitiateTransferRequest,
  type TransferActionRequest,
} from "@/lib/demo/custody-service"
import { operationalNodeForPartyView } from "@/lib/demo/party-view-auth"
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
