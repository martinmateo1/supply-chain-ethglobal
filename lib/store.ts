import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import {
  DEFAULT_SELECTED_ACCOUNT_ID,
  SEED_ACCOUNTS,
  SEED_ASSETS,
  SEED_TRANSFERS,
} from "@/lib/data"
import type { Account, Asset, Transfer } from "@/lib/types"

type NewTransferInput = {
  fromAccountId: string
  toAccountId: string
  assetId: string
  quantity: number
}

type TraceabilityState = {
  accounts: Account[]
  assets: Asset[]
  transfers: Transfer[]
  selectedAccountId: string
  selectAccount: (id: string) => void
  resetData: () => void
  addTransfer: (input: NewTransferInput) => void
  assetsByAccount: (accountId: string) => Asset[]
  transfersSentByAccount: (accountId: string) => Transfer[]
  transfersReceivedByAccount: (accountId: string) => Transfer[]
  accountTotalTons: (accountId: string) => number
}

const initialState = {
  accounts: SEED_ACCOUNTS,
  assets: SEED_ASSETS,
  transfers: SEED_TRANSFERS,
  selectedAccountId: DEFAULT_SELECTED_ACCOUNT_ID,
}

type PersistedTraceabilityState = {
  assets?: Asset[]
  transfers?: Transfer[]
  holdings?: Asset[]
  selectedAccountId?: string
}

export const useTraceabilityStore = create<TraceabilityState>()(
  persist(
    (set, get) => ({
      ...initialState,
      selectAccount: (id) => set({ selectedAccountId: id }),
      resetData: () => set(initialState),
      addTransfer: ({ fromAccountId, toAccountId, assetId, quantity }) => {
        const state = get()
        const sourceAsset = state.assets.find((a) => a.id === assetId)
        if (!sourceAsset || sourceAsset.accountId !== fromAccountId) return
        if (sourceAsset.quantity < quantity) return

        const updatedAssets = state.assets
          .map((a) => {
            if (a.id === assetId) {
              return { ...a, quantity: a.quantity - quantity }
            }
            return a
          })
          .filter((a) => a.quantity > 0)

        const existingDest = updatedAssets.find(
          (a) =>
            a.accountId === toAccountId &&
            a.commodity === sourceAsset.commodity &&
            JSON.stringify([...a.certifications].sort()) ===
              JSON.stringify([...sourceAsset.certifications].sort()) &&
            a.rating === sourceAsset.rating
        )

        let finalAssets: Asset[]
        if (existingDest) {
          finalAssets = updatedAssets.map((a) =>
            a.id === existingDest.id ? { ...a, quantity: a.quantity + quantity } : a
          )
        } else {
          const newAsset: Asset = {
            id: `a${Date.now()}`,
            accountId: toAccountId,
            commodity: sourceAsset.commodity,
            certifications: sourceAsset.certifications,
            rating: sourceAsset.rating,
            quantity,
            unit: "tons",
          }
          finalAssets = [...updatedAssets, newAsset]
        }

        const newTransfer: Transfer = {
          id: `t${Date.now()}`,
          fromAccountId,
          toAccountId,
          commodity: sourceAsset.commodity,
          certifications: sourceAsset.certifications,
          rating: sourceAsset.rating,
          quantity,
          unit: "tons",
          occurredAt: new Date().toISOString(),
        }

        set({ assets: finalAssets, transfers: [...state.transfers, newTransfer] })
      },
      assetsByAccount: (accountId) =>
        get().assets.filter((asset) => asset.accountId === accountId),
      transfersSentByAccount: (accountId) =>
        get()
          .transfers.filter((transfer) => transfer.fromAccountId === accountId)
          .sort(
            (a, b) =>
              new Date(b.occurredAt).getTime() -
              new Date(a.occurredAt).getTime()
          ),
      transfersReceivedByAccount: (accountId) =>
        get()
          .transfers.filter((transfer) => transfer.toAccountId === accountId)
          .sort(
            (a, b) =>
              new Date(b.occurredAt).getTime() -
              new Date(a.occurredAt).getTime()
          ),
      accountTotalTons: (accountId) =>
        get()
          .assets.filter((asset) => asset.accountId === accountId)
          .reduce((total, asset) => total + asset.quantity, 0),
    }),
    {
      name: "hackathon-traceability",
      version: 6,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = persistedState as PersistedTraceabilityState

        if (version < 2) {
          return {
            selectedAccountId: state.selectedAccountId,
            assets: SEED_ASSETS,
          }
        }

        if (version < 3) {
          return {
            selectedAccountId: state.selectedAccountId,
            assets: state.assets ?? state.holdings ?? SEED_ASSETS,
          }
        }

        if (version < 5) {
          return {
            selectedAccountId: state.selectedAccountId,
            assets: SEED_ASSETS,
          }
        }

        if (version < 6) {
          return {
            selectedAccountId: state.selectedAccountId,
            assets: state.assets ?? SEED_ASSETS,
            transfers: SEED_TRANSFERS,
          }
        }

        return state
      },
      partialize: (state) => ({
        assets: state.assets,
        transfers: state.transfers,
        selectedAccountId: state.selectedAccountId,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as PersistedTraceabilityState | undefined

        return {
          ...current,
          assets: persistedState?.assets ?? current.assets,
          transfers: persistedState?.transfers ?? current.transfers,
          selectedAccountId:
            persistedState?.selectedAccountId ?? current.selectedAccountId,
        }
      },
    }
  )
)
