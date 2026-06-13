/**
 * UI/demo state only — NOT custody source of truth.
 * Authoritative LotPosition quantities and CustodyTransfers live on Canton/Daml.
 * Use lib/ledger/* and future app/api/ledger/* routes for ledger-backed state.
 */
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import {
  DEFAULT_SELECTED_ACCOUNT_ID,
  DEFAULT_SELECTED_COMPANY_ID,
  SEED_ACCOUNTS,
  SEED_ASSETS,
  SEED_COMPANIES,
  SEED_TRANSFERS,
} from "@/lib/data"
import { isAssetVisibleToParty, transferMatchesAsset } from "@/lib/provenance"
import type { Account, Asset, Company, Transfer, TransferAttachment } from "@/lib/types"

type NewTransferInput = {
  fromAccountId: string
  toAccountId: string
  assetId: string
  quantity: number
  attachments?: TransferAttachment[]
}

type TraceabilityState = {
  companies: Company[]
  accounts: Account[]
  assets: Asset[]
  transfers: Transfer[]
  selectedAccountId: string
  selectedCompanyId: string
  selectAccount: (id: string) => void
  selectCompany: (id: string) => void
  resetData: () => void
  addTransfer: (input: NewTransferInput) => void
  assetById: (id: string) => Asset | undefined
  accountById: (id: string) => Account | undefined
  companyById: (id: string) => Company | undefined
  accountsByCompany: (companyId: string) => Account[]
  relatedTransfersForAsset: (assetId: string) => Transfer[]
  isAssetVisibleToSelectedParty: (assetId: string) => boolean
  assetsByAccount: (accountId: string) => Asset[]
  transfersSentByAccount: (accountId: string) => Transfer[]
  transfersReceivedByAccount: (accountId: string) => Transfer[]
  accountTotalTons: (accountId: string) => number
  companyTotalTons: (companyId: string) => number
}

const initialState = {
  companies: SEED_COMPANIES,
  accounts: SEED_ACCOUNTS,
  assets: SEED_ASSETS,
  transfers: SEED_TRANSFERS,
  selectedAccountId: DEFAULT_SELECTED_ACCOUNT_ID,
  selectedCompanyId: DEFAULT_SELECTED_COMPANY_ID,
}

type PersistedTraceabilityState = {
  assets?: Asset[]
  transfers?: Transfer[]
  holdings?: Asset[]
  selectedAccountId?: string
}

function normalizeTransfers(transfers: Transfer[] | undefined): Transfer[] {
  return transfers ?? SEED_TRANSFERS
}

export const useTraceabilityStore = create<TraceabilityState>()(
  persist(
    (set, get) => ({
      ...initialState,
      selectAccount: (id) => set({ selectedAccountId: id }),
      selectCompany: (id) => {
        const state = get()
        const firstAccount = state.accounts.find((a) => a.companyId === id)
        set({
          selectedCompanyId: id,
          selectedAccountId: firstAccount?.id ?? state.selectedAccountId,
        })
      },
      resetData: () => set(initialState),
      addTransfer: ({
        fromAccountId,
        toAccountId,
        assetId,
        quantity,
        attachments,
      }) => {
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
        let destAsset: Asset
        if (existingDest) {
          // Merge into existing holding — accumulate sources without duplicates
          const mergedSources = Array.from(
            new Set([...(existingDest.sourceAssetIds ?? []), assetId])
          )
          destAsset = {
            ...existingDest,
            quantity: existingDest.quantity + quantity,
            sourceAssetIds: mergedSources,
          }
          finalAssets = updatedAssets.map((a) =>
            a.id === existingDest.id ? destAsset : a
          )
        } else {
          // New holding — single source
          destAsset = {
            id: `a${Date.now()}`,
            accountId: toAccountId,
            commodity: sourceAsset.commodity,
            certifications: sourceAsset.certifications,
            rating: sourceAsset.rating,
            quantity,
            unit: "tons",
            sourceAssetIds: [assetId],
          }
          finalAssets = [...updatedAssets, destAsset]
        }

        const newTransfer: Transfer = {
          id: `t${Date.now()}`,
          fromAccountId,
          toAccountId,
          fromAssetId: assetId,
          toAssetId: destAsset.id,
          commodity: sourceAsset.commodity,
          certifications: sourceAsset.certifications,
          rating: sourceAsset.rating,
          quantity,
          unit: "tons",
          occurredAt: new Date().toISOString(),
          ...(attachments && attachments.length > 0 ? { attachments } : {}),
        }

        set({ assets: finalAssets, transfers: [...state.transfers, newTransfer] })
      },
      assetById: (id) => get().assets.find((asset) => asset.id === id),
      accountById: (id) => get().accounts.find((account) => account.id === id),
      companyById: (id) =>
        get().companies.find((company) => company.id === id),
      accountsByCompany: (companyId) =>
        get().accounts.filter((account) => account.companyId === companyId),
      relatedTransfersForAsset: (assetId) => {
        const asset = get().assets.find((item) => item.id === assetId)
        if (!asset) return []

        return get()
          .transfers.filter((transfer) => transferMatchesAsset(transfer, asset))
          .sort(
            (a, b) =>
              new Date(b.occurredAt).getTime() -
              new Date(a.occurredAt).getTime()
          )
      },
      isAssetVisibleToSelectedParty: (assetId) => {
        const asset = get().assets.find((item) => item.id === assetId)
        if (!asset) return false

        return isAssetVisibleToParty(
          asset,
          get().selectedAccountId,
          get().transfers
        )
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
      companyTotalTons: (companyId) => {
        const state = get()
        const accountIds = new Set(
          state.accounts
            .filter((a) => a.companyId === companyId)
            .map((a) => a.id)
        )
        return state.assets
          .filter((asset) => accountIds.has(asset.accountId))
          .reduce((total, asset) => total + asset.quantity, 0)
      },
    }),
    {
      name: "hackathon-traceability",
      version: 12,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = persistedState as PersistedTraceabilityState

        if (version < 12) {
          return {
            selectedAccountId: DEFAULT_SELECTED_ACCOUNT_ID,
            selectedCompanyId: DEFAULT_SELECTED_COMPANY_ID,
            assets: SEED_ASSETS,
            transfers: SEED_TRANSFERS,
          }
        }

        if (version < 10) {
          return {
            selectedAccountId: DEFAULT_SELECTED_ACCOUNT_ID,
            selectedCompanyId: DEFAULT_SELECTED_COMPANY_ID,
            assets: SEED_ASSETS,
            transfers: SEED_TRANSFERS,
          }
        }

        if (version < 9) {
          return {
            selectedAccountId: DEFAULT_SELECTED_ACCOUNT_ID,
            assets: SEED_ASSETS,
            transfers: SEED_TRANSFERS,
          }
        }

        if (version < 8) {
          return {
            selectedAccountId: state.selectedAccountId ?? DEFAULT_SELECTED_ACCOUNT_ID,
            assets: state.assets ?? SEED_ASSETS,
            transfers: normalizeTransfers(state.transfers),
          }
        }

        if (version < 7) {
          return {
            selectedAccountId: DEFAULT_SELECTED_ACCOUNT_ID,
            assets: SEED_ASSETS,
            transfers: SEED_TRANSFERS,
          }
        }

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

        return {
          ...state,
          transfers: normalizeTransfers(state.transfers),
        }
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
          transfers: normalizeTransfers(persistedState?.transfers),
          selectedAccountId:
            persistedState?.selectedAccountId ?? current.selectedAccountId,
        }
      },
    }
  )
)
