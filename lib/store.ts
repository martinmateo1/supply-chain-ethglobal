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
import { withSeedTransferAssetIds } from "@/lib/seed-transfer-assets"
import type {
  Account,
  Asset,
  Certification,
  CommodityType,
  OriginEvidenceReference,
  Rating,
  Transfer,
  TransferAttachment,
} from "@/lib/types"

type NewTransferInput = {
  fromAccountId: string
  toAccountId: string
  assetId: string
  quantity: number
  attachments?: TransferAttachment[]
}

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
  addTransfer: (input: NewTransferInput) => void
  addLot: (input: NewLotInput) => void
  assetById: (id: string) => Asset | undefined
  accountById: (id: string) => Account | undefined
  relatedTransfersForAsset: (assetId: string) => Transfer[]
  isAssetVisibleToSelectedParty: (assetId: string) => boolean
  visibleAssetsForPartyView: (partyViewId: string) => Asset[]
  visibleTransfersSentForPartyView: (partyViewId: string) => Transfer[]
  visibleTransfersReceivedForPartyView: (partyViewId: string) => Transfer[]
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

function sortTransfersNewestFirst(transfers: Transfer[]): Transfer[] {
  return [...transfers].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )
}

function transferActorPartyViewId(partyViewId: string): string {
  const view = partyViewById(partyViewId)
  return view?.operationalNodeId ?? partyViewId
}

function normalizeTransfers(transfers: Transfer[] | undefined): Transfer[] {
  return withSeedTransferAssetIds(transfers ?? SEED_TRANSFERS)
}

function preferNonEmptyOriginEvidence(
  primary?: OriginEvidenceReference[],
  fallback?: OriginEvidenceReference[]
): OriginEvidenceReference[] | undefined {
  if (primary && primary.length > 0) return primary
  if (fallback && fallback.length > 0) return fallback
  return undefined
}

const PRODUCTION_SITE_NODE_ID = "production-site"

export const useTraceabilityStore = create<TraceabilityState>()(
  persist(
    (set, get) => ({
      ...initialState,
      selectPartyView: (id) => set({ selectedPartyViewId: id }),
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
        if (existingDest) {
          finalAssets = updatedAssets.map((a) =>
            a.id === existingDest.id
              ? {
                  ...a,
                  quantity: a.quantity + quantity,
                  originIdentifier:
                    a.originIdentifier ?? sourceAsset.originIdentifier,
                  originEvidence: preferNonEmptyOriginEvidence(
                    a.originEvidence,
                    sourceAsset.originEvidence
                  ),
                }
              : a
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
            ...(sourceAsset.originIdentifier
              ? { originIdentifier: sourceAsset.originIdentifier }
              : {}),
            ...(sourceAsset.originEvidence
              ? { originEvidence: sourceAsset.originEvidence }
              : {}),
          }
          finalAssets = [...updatedAssets, newAsset]
        }

        const newTransfer: Transfer = {
          id: `t${Date.now()}`,
          fromAccountId,
          toAccountId,
          assetId,
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
          id: `a${Date.now()}`,
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
              transfer.fromAccountId === actorId
          )
        )
      },
      visibleTransfersReceivedForPartyView: (partyViewId) => {
        const actorId = transferActorPartyViewId(partyViewId)
        return sortTransfersNewestFirst(
          get().transfers.filter(
            (transfer) =>
              isTransferVisibleToParty(transfer, actorId) &&
              transfer.toAccountId === actorId
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
      version: 9,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = persistedState as PersistedTraceabilityState

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
      partialize: (state) => ({
        assets: state.assets,
        transfers: state.transfers,
        selectedPartyViewId: state.selectedPartyViewId,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as PersistedTraceabilityState | undefined

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
