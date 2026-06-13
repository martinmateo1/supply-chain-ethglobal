/**
 * UI/demo state only — NOT custody source of truth.
 * Authoritative LotPosition quantities and CustodyTransfers live on Canton/Daml.
 * Use lib/ledger/* and future app/api/ledger/* routes for ledger-backed state.
 */
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import {
  DEFAULT_SELECTED_ACCOUNT_ID,
  SEED_ACCOUNTS,
  SEED_ASSETS,
  SEED_TRANSFERS,
} from "@/lib/data"
import {
  DEFAULT_PARTY_VIEW_ID,
  partyViewById,
} from "@/lib/demo/party-views"
import {
  isAssetVisibleToParty,
  isTransferVisibleToParty,
  transferMatchesAsset,
} from "@/lib/provenance"
import {
  availableQuantityForAsset as computeAvailableQuantity,
  nextDemoAssetId,
} from "@/lib/demo/custody-service"
import { isClientCantonBackend } from "@/lib/ledger/client-mode"
import { withSeedTransferAssetIds } from "@/lib/seed-transfer-assets"
import type {
  Account,
  Asset,
  Certification,
  CommodityType,
  OriginEvidenceReference,
  Rating,
  Transfer,
} from "@/lib/types"

export type NewLotInput = {
  accountId: string
  commodity: CommodityType
  quantity: number
  rating: Rating
  certifications: Certification[]
  originIdentifier: string
  originEvidence?: OriginEvidenceReference[]
}

type TraceabilityState = {
  accounts: Account[]
  assets: Asset[]
  transfers: Transfer[]
  selectedPartyViewId: string
  selectPartyView: (id: string) => void
  resetData: () => void
  applyCustodySnapshot: (snapshot: { assets: Asset[]; transfers: Transfer[] }) => void
  addLot: (input: NewLotInput) => void
  assetById: (id: string) => Asset | undefined
  accountById: (id: string) => Account | undefined
  availableQuantityForAsset: (assetId: string) => number
  relatedTransfersForAsset: (assetId: string) => Transfer[]
  isAssetVisibleToSelectedParty: (assetId: string) => boolean
  visibleAssetsForPartyView: (partyViewId: string) => Asset[]
  visibleTransfersSentForPartyView: (partyViewId: string) => Transfer[]
  visibleTransfersReceivedForPartyView: (partyViewId: string) => Transfer[]
  visiblePendingInboundForPartyView: (partyViewId: string) => Transfer[]
  visiblePendingOutboundForPartyView: (partyViewId: string) => Transfer[]
  partyViewVisibleTotalTons: (partyViewId: string) => number
  assetsByAccount: (accountId: string) => Asset[]
  transfersSentByAccount: (accountId: string) => Transfer[]
  transfersReceivedByAccount: (accountId: string) => Transfer[]
  accountTotalTons: (accountId: string) => number
}

const initialState = {
  accounts: SEED_ACCOUNTS,
  assets: SEED_ASSETS,
  transfers: SEED_TRANSFERS,
  selectedPartyViewId: DEFAULT_PARTY_VIEW_ID,
}

type PersistedTraceabilityState = {
  assets?: Asset[]
  transfers?: Transfer[]
  holdings?: Asset[]
  selectedAccountId?: string
  selectedPartyViewId?: string
}

function transferSortTime(transfer: Transfer): number {
  return new Date(transfer.occurredAt ?? transfer.createdAt).getTime()
}

function sortTransfersNewestFirst(transfers: Transfer[]): Transfer[] {
  return [...transfers].sort(
    (a, b) => transferSortTime(b) - transferSortTime(a)
  )
}

function transferActorPartyViewId(partyViewId: string): string {
  const view = partyViewById(partyViewId)
  return view?.operationalNodeId ?? partyViewId
}

function normalizeTransfers(transfers: Transfer[] | undefined): Transfer[] {
  return withSeedTransferAssetIds(transfers ?? SEED_TRANSFERS)
}

const PRODUCTION_SITE_NODE_ID = "production-site"

export const useTraceabilityStore = create<TraceabilityState>()(
  persist(
    (set, get) => ({
      ...initialState,
      selectPartyView: (id) => set({ selectedPartyViewId: id }),
      resetData: () => set(initialState),
      applyCustodySnapshot: ({ assets, transfers }) =>
        set({ assets, transfers: normalizeTransfers(transfers) }),
      addLot: ({
        accountId,
        commodity,
        quantity,
        rating,
        certifications,
        originIdentifier,
        originEvidence,
      }) => {
        if (accountId !== PRODUCTION_SITE_NODE_ID) return
        if (!Number.isFinite(quantity) || quantity <= 0) return

        const newAsset: Asset = {
          id: nextDemoAssetId(),
          accountId,
          commodity,
          certifications,
          rating,
          quantity,
          unit: "tons",
          originIdentifier,
          ...(originEvidence && originEvidence.length > 0
            ? { originEvidence }
            : {}),
        }

        set((state) => ({ assets: [...state.assets, newAsset] }))
      },
      assetById: (id) => get().assets.find((asset) => asset.id === id),
      accountById: (id) => get().accounts.find((account) => account.id === id),
      availableQuantityForAsset: (assetId) => {
        const asset = get().assets.find((item) => item.id === assetId)
        if (!asset) return 0
        return computeAvailableQuantity(asset, get().transfers)
      },
      relatedTransfersForAsset: (assetId) => {
        const asset = get().assets.find((item) => item.id === assetId)
        if (!asset) return []

        return get()
          .transfers.filter((transfer) => transferMatchesAsset(transfer, asset))
          .sort((a, b) => transferSortTime(b) - transferSortTime(a))
      },
      isAssetVisibleToSelectedParty: (assetId) => {
        const asset = get().assets.find((item) => item.id === assetId)
        if (!asset) return false

        return isAssetVisibleToParty(
          asset,
          transferActorPartyViewId(get().selectedPartyViewId),
          get().transfers
        )
      },
      visibleAssetsForPartyView: (partyViewId) => {
        const actorId = transferActorPartyViewId(partyViewId)
        return get().assets.filter((asset) =>
          isAssetVisibleToParty(asset, actorId, get().transfers)
        )
      },
      visibleTransfersSentForPartyView: (partyViewId) => {
        const actorId = transferActorPartyViewId(partyViewId)
        return sortTransfersNewestFirst(
          get().transfers.filter(
            (transfer) =>
              isTransferVisibleToParty(transfer, actorId) &&
              transfer.fromAccountId === actorId &&
              transfer.status !== "pending"
          )
        )
      },
      visibleTransfersReceivedForPartyView: (partyViewId) => {
        const actorId = transferActorPartyViewId(partyViewId)
        return sortTransfersNewestFirst(
          get().transfers.filter(
            (transfer) =>
              isTransferVisibleToParty(transfer, actorId) &&
              transfer.toAccountId === actorId &&
              transfer.status !== "pending"
          )
        )
      },
      visiblePendingInboundForPartyView: (partyViewId) => {
        const actorId = transferActorPartyViewId(partyViewId)
        return sortTransfersNewestFirst(
          get().transfers.filter(
            (transfer) =>
              isTransferVisibleToParty(transfer, actorId) &&
              transfer.toAccountId === actorId &&
              transfer.status === "pending"
          )
        )
      },
      visiblePendingOutboundForPartyView: (partyViewId) => {
        const actorId = transferActorPartyViewId(partyViewId)
        return sortTransfersNewestFirst(
          get().transfers.filter(
            (transfer) =>
              isTransferVisibleToParty(transfer, actorId) &&
              transfer.fromAccountId === actorId &&
              transfer.status === "pending"
          )
        )
      },
      partyViewVisibleTotalTons: (partyViewId) =>
        get()
          .visibleAssetsForPartyView(partyViewId)
          .reduce((total, asset) => total + asset.quantity, 0),
      assetsByAccount: (accountId) =>
        get().assets.filter((asset) => asset.accountId === accountId),
      transfersSentByAccount: (accountId) =>
        sortTransfersNewestFirst(
          get().transfers.filter((transfer) => transfer.fromAccountId === accountId)
        ),
      transfersReceivedByAccount: (accountId) =>
        sortTransfersNewestFirst(
          get().transfers.filter((transfer) => transfer.toAccountId === accountId)
        ),
      accountTotalTons: (accountId) =>
        get()
          .assets.filter((asset) => asset.accountId === accountId)
          .reduce((total, asset) => total + asset.quantity, 0),
    }),
    {
      name: "hackathon-traceability",
      version: 10,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = persistedState as PersistedTraceabilityState

        if (version < 10) {
          return {
            selectedPartyViewId:
              state.selectedPartyViewId ??
              state.selectedAccountId ??
              DEFAULT_PARTY_VIEW_ID,
            assets: state.assets ?? SEED_ASSETS,
            transfers: normalizeTransfers(state.transfers),
          }
        }

        if (version < 9) {
          return {
            selectedPartyViewId:
              state.selectedPartyViewId ??
              state.selectedAccountId ??
              DEFAULT_PARTY_VIEW_ID,
            assets: state.assets ?? SEED_ASSETS,
            transfers: normalizeTransfers(state.transfers),
          }
        }

        if (version < 8) {
          return {
            selectedPartyViewId:
              state.selectedPartyViewId ??
              state.selectedAccountId ??
              DEFAULT_SELECTED_ACCOUNT_ID,
            assets: state.assets ?? SEED_ASSETS,
            transfers: normalizeTransfers(state.transfers),
          }
        }

        if (version < 7) {
          return {
            selectedPartyViewId: DEFAULT_PARTY_VIEW_ID,
            assets: SEED_ASSETS,
            transfers: SEED_TRANSFERS,
          }
        }

        if (version < 2) {
          return {
            selectedPartyViewId:
              state.selectedPartyViewId ??
              state.selectedAccountId ??
              DEFAULT_PARTY_VIEW_ID,
            assets: SEED_ASSETS,
          }
        }

        if (version < 3) {
          return {
            selectedPartyViewId:
              state.selectedPartyViewId ??
              state.selectedAccountId ??
              DEFAULT_PARTY_VIEW_ID,
            assets: state.assets ?? state.holdings ?? SEED_ASSETS,
          }
        }

        if (version < 5) {
          return {
            selectedPartyViewId:
              state.selectedPartyViewId ??
              state.selectedAccountId ??
              DEFAULT_PARTY_VIEW_ID,
            assets: SEED_ASSETS,
          }
        }

        if (version < 6) {
          return {
            selectedPartyViewId:
              state.selectedPartyViewId ??
              state.selectedAccountId ??
              DEFAULT_PARTY_VIEW_ID,
            assets: state.assets ?? SEED_ASSETS,
            transfers: SEED_TRANSFERS,
          }
        }

        return {
          ...state,
          selectedPartyViewId:
            state.selectedPartyViewId ??
            state.selectedAccountId ??
            DEFAULT_PARTY_VIEW_ID,
          transfers: normalizeTransfers(state.transfers),
        }
      },
      partialize: (state) => {
        if (isClientCantonBackend()) {
          return { selectedPartyViewId: state.selectedPartyViewId }
        }

        return {
          assets: state.assets,
          transfers: state.transfers,
          selectedPartyViewId: state.selectedPartyViewId,
        }
      },
      merge: (persisted, current) => {
        const persistedState = persisted as PersistedTraceabilityState | undefined

        if (isClientCantonBackend()) {
          return {
            ...current,
            assets: [],
            transfers: [],
            selectedPartyViewId:
              persistedState?.selectedPartyViewId ??
              persistedState?.selectedAccountId ??
              current.selectedPartyViewId,
          }
        }

        return {
          ...current,
          assets: persistedState?.assets ?? current.assets,
          transfers: normalizeTransfers(persistedState?.transfers),
          selectedPartyViewId:
            persistedState?.selectedPartyViewId ??
            persistedState?.selectedAccountId ??
            current.selectedPartyViewId,
        }
      },
    }
  )
)
