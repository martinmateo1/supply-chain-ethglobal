import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import {
  DEFAULT_SELECTED_ACCOUNT_ID,
  SEED_ACCOUNTS,
  SEED_HOLDINGS,
} from "@/lib/data"
import type { Account, Holding } from "@/lib/types"

type TraceabilityState = {
  accounts: Account[]
  holdings: Holding[]
  selectedAccountId: string
  selectAccount: (id: string) => void
  resetData: () => void
  holdingsByAccount: (accountId: string) => Holding[]
  accountTotalTons: (accountId: string) => number
}

const initialState = {
  accounts: SEED_ACCOUNTS,
  holdings: SEED_HOLDINGS,
  selectedAccountId: DEFAULT_SELECTED_ACCOUNT_ID,
}

export const useTraceabilityStore = create<TraceabilityState>()(
  persist(
    (set, get) => ({
      ...initialState,
      selectAccount: (id) => set({ selectedAccountId: id }),
      resetData: () => set(initialState),
      holdingsByAccount: (accountId) =>
        get().holdings.filter((holding) => holding.accountId === accountId),
      accountTotalTons: (accountId) =>
        get()
          .holdings.filter((holding) => holding.accountId === accountId)
          .reduce((total, holding) => total + holding.quantity, 0),
    }),
    {
      name: "hackathon-traceability",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        holdings: state.holdings,
        selectedAccountId: state.selectedAccountId,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<TraceabilityState> | undefined

        return {
          ...current,
          holdings: persistedState?.holdings ?? current.holdings,
          selectedAccountId:
            persistedState?.selectedAccountId ?? current.selectedAccountId,
        }
      },
    }
  )
)
