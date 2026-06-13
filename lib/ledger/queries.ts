import {
  cantonTransferHistory,
  cantonVisibleHoldings,
} from "@/lib/ledger/canton-custody-service"

export type VisibleHoldingsQuery = {
  partyViewId: string
}

export type TransferHistoryQuery = {
  partyViewId: string
  lotPositionId?: string
}

export const ledgerQueries = {
  visibleHoldings: (input: VisibleHoldingsQuery) =>
    cantonVisibleHoldings(input.partyViewId),
  transferHistory: (input: TransferHistoryQuery) =>
    cantonTransferHistory(input.partyViewId),
}
