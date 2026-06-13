import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"

export type VisibleHoldingsQuery = {
  partyViewId: string
}

export type TransferHistoryQuery = {
  partyViewId: string
  lotPositionId?: string
}

/**
 * Party View-aware ledger queries.
 * Results are mapped to UI domain types via lib/ledger/mappers.ts.
 */
export const ledgerQueries = {
  visibleHoldings(_input: VisibleHoldingsQuery): never {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "visibleHoldings is not implemented until Canton query integration lands.",
    )
  },

  transferHistory(_input: TransferHistoryQuery): never {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "transferHistory is not implemented until Canton query integration lands.",
    )
  },
}
