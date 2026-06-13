/**
 * Demo custody business logic — authoritative rules for MVP gateway + store.
 * Future Canton adapter replaces internals; gateway boundary stays stable.
 */
import {
  assertCombineOperator,
  assertRecipientPartyView,
  assertSenderPartyView,
} from "@/lib/demo/party-view-auth"
import { custodyRouteIndex } from "@/lib/demo/custody-route"
import { originFingerprint } from "@/lib/provenance"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import { certificationKey } from "@/lib/types"
import type {
  Asset,
  OriginEvidenceReference,
  Transfer,
  TransferAttachment,
  TransferStatus,
} from "@/lib/types"

export type CustodySnapshot = {
  assets: Asset[]
  transfers: Transfer[]
}

export type InitiateTransferRequest = {
  partyViewId: string
  fromAccountId: string
  toAccountId: string
  assetId: string
  quantity: number
  attachments?: TransferAttachment[]
}

export type TransferActionRequest = {
  partyViewId: string
  transferId: string
}

export type CombineLotsRequest = {
  partyViewId: string
  accountId: string
  lotIds: string[]
}

export type CompatibilityResult =
  | { compatible: true }
  | { compatible: false; reason: string }

export type CreateLotRequest = {
  partyViewId: string
  accountId: string
  commodity: Asset["commodity"]
  quantity: number
  rating: Asset["rating"]
  certifications: Asset["certifications"]
  originIdentifier: string
  attachments?: TransferAttachment[]
}

function inferDocumentType(attachment: TransferAttachment): string {
  if (attachment.documentType) return attachment.documentType
  const name = attachment.name.toLowerCase()
  if (name.includes("certificate")) return "certificate"
  if (name.includes("receipt")) return "receipt"
  if (name.includes("sheet") || name.includes("transport")) return "transport-sheet"
  if (attachment.mimeType.startsWith("image/")) return "image-evidence"
  if (attachment.mimeType === "application/pdf") return "pdf-document"
  return "supporting-document"
}

function normalizeAttachments(
  attachments: TransferAttachment[] | undefined
): TransferAttachment[] {
  if (!attachments?.length) return []

  const now = new Date().toISOString()
  return attachments.map((attachment) => {
    if (!attachment.name?.trim() || !attachment.hash?.trim()) {
      throw new LedgerError(
        LedgerErrorCode.EVIDENCE_REFERENCE_INVALID,
        "Each evidence reference must include a document name and content hash."
      )
    }

    return {
      ...attachment,
      documentType: inferDocumentType(attachment),
      timestamp: attachment.timestamp ?? now,
    }
  })
}

export function reservedQuantityForAsset(
  assetId: string,
  transfers: Transfer[]
): number {
  return transfers
    .filter((t) => t.status === "pending" && t.assetId === assetId)
    .reduce((sum, t) => sum + t.quantity, 0)
}

export function availableQuantityForAsset(
  asset: Asset,
  transfers: Transfer[]
): number {
  return asset.quantity - reservedQuantityForAsset(asset.id, transfers)
}

/**
 * Centralized anti-double-spend guard shared by every custody operation that
 * consumes source quantity (transfer/split and combine). A certified source
 * quantity can never be allocated beyond its remaining available balance
 * (available = quantity − reserved-by-pending-transfers). Already-archived /
 * consumed lots are simply absent from the snapshot, so they have no balance to
 * spend at all.
 *
 * - When the overspend is against reserved (in-flight) quantity, this is a true
 *   double-spend → `DOUBLE_SPEND`.
 * - When nothing is reserved but the amount still exceeds the lot, it is a plain
 *   over-amount → `INSUFFICIENT_QUANTITY`.
 */
export function assertNoDoubleSpend(
  asset: Asset,
  transfers: Transfer[],
  requestedQuantity: number
): void {
  const reserved = reservedQuantityForAsset(asset.id, transfers)
  const available = asset.quantity - reserved
  if (requestedQuantity <= available) return

  if (reserved > 0) {
    throw new LedgerError(
      LedgerErrorCode.DOUBLE_SPEND,
      `Double-spend blocked: only ${available} of ${asset.quantity} tons are available — ${reserved} tons are reserved by a pending transfer or already consumed. Reduce the amount or wait for pending transfers to settle.`
    )
  }

  throw new LedgerError(
    LedgerErrorCode.INSUFFICIENT_QUANTITY,
    "Transfer quantity cannot exceed the available quantity in the source lot position. A split must conserve quantity: transferred + remaining equals the source quantity."
  )
}

export type SplitConservation = {
  before: number
  transferred: number
  remaining: number
}

/**
 * Pure conservation arithmetic for a partial transfer (split). Quantities are
 * integer tons in this demo, so transferred + remaining must equal before
 * EXACTLY — there is no rounding or unit conversion that could hide a leak.
 * Throws if the split would violate conservation or use an invalid amount.
 */
export function splitConservation(
  sourceQuantity: number,
  transferQuantity: number
): SplitConservation {
  if (!Number.isFinite(sourceQuantity) || sourceQuantity <= 0) {
    throw new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Source lot position has no quantity to split."
    )
  }
  if (!Number.isFinite(transferQuantity) || transferQuantity <= 0) {
    throw new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Transfer quantity must be greater than zero. Transferred + remaining must equal the source quantity."
    )
  }
  if (transferQuantity > sourceQuantity) {
    throw new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Transfer quantity cannot exceed the source quantity. Transferred + remaining must equal the source quantity."
    )
  }

  const remaining = sourceQuantity - transferQuantity
  if (transferQuantity + remaining !== sourceQuantity) {
    throw new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Split failed quantity conservation: transferred + remaining must equal the source quantity."
    )
  }

  return { before: sourceQuantity, transferred: transferQuantity, remaining }
}

/** A transfer is a split when it moves less than the full available quantity. */
export function isPartialTransfer(
  transferQuantity: number,
  availableQuantity: number
): boolean {
  return transferQuantity > 0 && transferQuantity < availableQuantity
}

/**
 * Two lot positions can combine only when they share the same Commodity, the
 * identical certification set (order-independent), and the same quality rating.
 * Returns a structured reason when incompatible so the UI can explain the block.
 */
export function lotsAreCompatible(a: Asset, b: Asset): CompatibilityResult {
  if (a.commodity !== b.commodity) {
    return {
      compatible: false,
      reason: `Different commodities cannot combine (${a.commodity} vs ${b.commodity}).`,
    }
  }
  if (certificationKey(a.certifications) !== certificationKey(b.certifications)) {
    return {
      compatible: false,
      reason:
        "Certification sets must match exactly. Combining would dilute or drop a certification.",
    }
  }
  if (a.rating !== b.rating) {
    return {
      compatible: false,
      reason: `Quality ratings must match (Grade ${a.rating} vs Grade ${b.rating}).`,
    }
  }
  return { compatible: true }
}

function mergeEvidence(
  lots: Asset[]
): OriginEvidenceReference[] | undefined {
  const seen = new Set<string>()
  const merged: OriginEvidenceReference[] = []
  for (const lot of lots) {
    for (const ref of lot.originEvidence ?? []) {
      if (seen.has(ref.hash)) continue
      seen.add(ref.hash)
      merged.push(ref)
    }
  }
  return merged.length > 0 ? merged : undefined
}

/**
 * Combine compatible lot positions owned by a single storage operational node
 * into one position. Conservation: the combined quantity equals the exact sum
 * of source available quantities. Provenance Links to every source lot are
 * preserved via `sourceLotIds`; certifications and evidence are carried forward.
 */
export function combineLots(
  snapshot: CustodySnapshot,
  input: CombineLotsRequest
): CustodySnapshot & { asset: Asset } {
  assertCombineOperator(input.partyViewId, input.accountId)

  const uniqueLotIds = Array.from(new Set(input.lotIds))
  if (uniqueLotIds.length < 2) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Select at least two lot positions to combine."
    )
  }

  const lots = uniqueLotIds.map((id) => {
    const lot = snapshot.assets.find((a) => a.id === id)
    if (!lot) {
      throw new LedgerError(
        LedgerErrorCode.SOURCE_ASSET_ALREADY_CONSUMED,
        "A selected lot position is no longer available to combine."
      )
    }
    if (lot.accountId !== input.accountId) {
      throw new LedgerError(
        LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
        "All lot positions must be held by the same operational node to combine."
      )
    }
    // Anti-double-spend: combine consumes the lot's full quantity, so it must
    // not be reserved/partially-allocated by a pending transfer.
    assertNoDoubleSpend(lot, snapshot.transfers, lot.quantity)
    return lot
  })

  const [first, ...rest] = lots
  for (const lot of rest) {
    const result = lotsAreCompatible(first, lot)
    if (!result.compatible) {
      throw new LedgerError(
        LedgerErrorCode.LEDGER_COMMAND_FAILED,
        result.reason
      )
    }
  }

  const combinedQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0)
  const sumOfSources = lots.map((lot) => lot.quantity).reduce((s, q) => s + q, 0)
  if (combinedQuantity !== sumOfSources) {
    throw new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Combine failed quantity conservation: combined quantity must equal the sum of sources."
    )
  }

  const sourceLotIds = Array.from(
    new Set(lots.flatMap((lot) => [...(lot.sourceLotIds ?? []), lot.id]))
  )
  const originIdentifier = lots.find((lot) => lot.originIdentifier)?.originIdentifier
  const originEvidence = mergeEvidence(lots)

  const combined: Asset = {
    id: nextAssetId(),
    accountId: input.accountId,
    commodity: first.commodity,
    certifications: first.certifications,
    rating: first.rating,
    quantity: combinedQuantity,
    unit: "tons",
    sourceLotIds,
    ...(originIdentifier ? { originIdentifier } : {}),
    ...(originEvidence ? { originEvidence } : {}),
  }

  const remainingAssets = snapshot.assets.filter(
    (a) => !uniqueLotIds.includes(a.id)
  )

  return {
    assets: [...remainingAssets, combined],
    transfers: snapshot.transfers,
    asset: combined,
  }
}

export type CustodyPathStep = {
  accountId: string
  quantity: number
  /** null for the origin step (the lot's starting custody, no inbound leg). */
  transferId: string | null
  evidenceHashes: string[]
  sourceProvenanceRef: string | null
  occurredAt: string | null
}

/**
 * Ordered custody path for a lot: the chain of operational nodes it passed
 * through, with per-leg evidence binding and provenance refs. Evidence stays
 * bound to the leg it was attached to — later legs never imply earlier
 * evidence. Shared with the attestation availability checks in Story 3.4.
 */
export function buildCustodyPath(
  asset: Asset,
  transfers: Transfer[]
): CustodyPathStep[] {
  // Chain identity is the batch signature (commodity + certification set +
  // rating), so the full multi-leg path is recovered even after the lot has
  // moved well past its origin node.
  const batchKey = `${asset.commodity}:${certificationKey(asset.certifications)}:${asset.rating}`
  const inSameBatch = (t: Transfer): boolean =>
    `${t.commodity}:${certificationKey(t.certifications)}:${t.rating}` === batchKey

  const legs = transfers
    .filter((t) => t.status === "accepted" && inSameBatch(t))
    .sort((a, b) => {
      const ai = custodyRouteIndex(a.fromAccountId)
      const bi = custodyRouteIndex(b.fromAccountId)
      if (ai !== bi) return ai - bi
      return (
        new Date(a.occurredAt ?? a.createdAt).getTime() -
        new Date(b.occurredAt ?? b.createdAt).getTime()
      )
    })

  const originStep = (accountId: string, quantity: number): CustodyPathStep => ({
    accountId,
    quantity,
    transferId: null,
    evidenceHashes: (asset.originEvidence ?? []).map((e) => e.hash),
    sourceProvenanceRef: null,
    occurredAt: null,
  })

  if (legs.length === 0) {
    return [originStep(asset.accountId, asset.quantity)]
  }

  const path: CustodyPathStep[] = [
    originStep(legs[0].fromAccountId, legs[0].quantity),
  ]

  for (const leg of legs) {
    path.push({
      accountId: leg.toAccountId,
      quantity: leg.quantity,
      transferId: leg.id,
      evidenceHashes: (leg.attachments ?? []).map((a) => a.hash),
      sourceProvenanceRef: leg.sourceProvenanceRef ?? null,
      occurredAt: leg.occurredAt ?? leg.createdAt,
    })
  }

  return path
}

export type ProvenanceOperationType = "origin" | "split" | "combine" | "transfer"

/**
 * One entry in the read-only provenance timeline. `conserved` reflects the
 * conservation equation `beforeQuantity === quantity + afterQuantity` (quantity
 * moved/held at this step, plus what remained at the source). Attestation
 * generation (Epic 4) consumes this projection without mutating prior state.
 */
export type ProvenanceTimelineEntry = {
  operationType: ProvenanceOperationType
  fromAccountId: string | null
  toAccountId: string | null
  /** Quantity that moved (transfer/split) or is held (origin/combine). */
  quantity: number
  /** Source quantity before the operation (split). null when not applicable. */
  beforeQuantity: number | null
  /** Quantity remaining at the source after the operation. null when n/a. */
  afterQuantity: number | null
  conserved: boolean
  sourceRefs: string[]
  derivedRefs: string[]
  evidenceHashes: string[]
  transferId: string | null
  occurredAt: string | null
}

function batchSignature(
  x: Pick<Asset, "commodity" | "certifications" | "rating">
): string {
  return `${x.commodity}:${certificationKey(x.certifications)}:${x.rating}`
}

/**
 * Pure, READ-ONLY provenance timeline for a lot position, derived entirely from
 * `assets` + `transfers` + provenance fields (no parallel persistence). It
 * extends `buildCustodyPath` with operation classification (origin | combine |
 * split | transfer), per-step conservation, and source/derived references.
 *
 * Visibility: pass `visibleTransfers` (already filtered to the active Party
 * View) to restrict the legs a party can see; defaults to the full set.
 */
export function buildProvenanceTimeline(
  asset: Asset,
  snapshot: CustodySnapshot,
  visibleTransfers?: Transfer[]
): ProvenanceTimelineEntry[] {
  const transfers = visibleTransfers ?? snapshot.transfers
  const path = buildCustodyPath(asset, transfers)
  const sig = batchSignature(asset)
  const sameBatch = (a: Asset): boolean => batchSignature(a) === sig

  const remainderAtNode = (accountId: string): number =>
    snapshot.assets
      .filter((a) => a.accountId === accountId && a.id !== asset.id && sameBatch(a))
      .reduce((sum, a) => sum + a.quantity, 0)

  const origin = path[0]
  const sourceLotIds = asset.sourceLotIds ?? []
  // A freshly combined lot sits at its node with no outbound leg yet and links
  // to two or more source positions — the only clean combine signal available.
  const isCombineOrigin = sourceLotIds.length >= 2 && path.length === 1

  const entries: ProvenanceTimelineEntry[] = [
    {
      operationType: isCombineOrigin ? "combine" : "origin",
      fromAccountId: null,
      toAccountId: origin.accountId,
      quantity: origin.quantity,
      beforeQuantity: null,
      afterQuantity: origin.quantity,
      conserved: true,
      sourceRefs: isCombineOrigin ? sourceLotIds : [],
      derivedRefs: isCombineOrigin ? [asset.id] : [],
      evidenceHashes: origin.evidenceHashes,
      transferId: null,
      occurredAt: origin.occurredAt,
    },
  ]

  for (let i = 1; i < path.length; i++) {
    const step = path[i]
    const fromAccountId = path[i - 1].accountId
    const transferred = step.quantity
    const remaining = remainderAtNode(fromAccountId)
    const isSplit = remaining > 0
    const before = transferred + remaining

    entries.push({
      operationType: isSplit ? "split" : "transfer",
      fromAccountId,
      toAccountId: step.accountId,
      quantity: transferred,
      beforeQuantity: before,
      afterQuantity: remaining,
      conserved: before === transferred + remaining,
      sourceRefs: step.sourceProvenanceRef ? [step.sourceProvenanceRef] : [],
      derivedRefs: [],
      evidenceHashes: step.evidenceHashes,
      transferId: step.transferId,
      occurredAt: step.occurredAt,
    })
  }

  return entries
}

function nextTransferId(): string {
  return `t${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function nextAssetId(): string {
  return `a${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Shared demo id generator for lot positions created outside custody-service. */
export function nextDemoAssetId(): string {
  return nextAssetId()
}

function findTransfer(snapshot: CustodySnapshot, transferId: string): Transfer {
  const transfer = snapshot.transfers.find((t) => t.id === transferId)
  if (!transfer) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Custody transfer not found."
    )
  }
  return transfer
}

function applyAcceptedTransfer(
  assets: Asset[],
  transfer: Transfer
): Asset[] {
  const sourceAsset = assets.find((a) => a.id === transfer.assetId)
  if (!sourceAsset) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Source lot position no longer exists."
    )
  }

  if (sourceAsset.quantity < transfer.quantity) {
    throw new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Insufficient quantity to complete this custody transfer."
    )
  }

  // Conservation guard: transferred + remaining must equal the source exactly.
  // For a full transfer this still holds (remaining === 0) and the source is
  // archived by the quantity > 0 filter below.
  const conservation = splitConservation(sourceAsset.quantity, transfer.quantity)

  const updatedAssets = assets
    .map((a) => {
      if (a.id === transfer.assetId) {
        return { ...a, quantity: conservation.remaining }
      }
      return a
    })
    .filter((a) => a.quantity > 0)

  const derivedSourceLotIds = Array.from(
    new Set([...(sourceAsset.sourceLotIds ?? []), sourceAsset.id])
  )

  const sourceOriginKey = sourceAsset.originIdentifier ?? ""
  const existingDest = updatedAssets.find(
    (a) =>
      a.accountId === transfer.toAccountId &&
      a.commodity === transfer.commodity &&
      JSON.stringify([...a.certifications].sort()) ===
        JSON.stringify([...transfer.certifications].sort()) &&
      a.rating === transfer.rating &&
      (a.originIdentifier ?? "") === sourceOriginKey
  )

  if (existingDest) {
    return updatedAssets.map((a) =>
      a.id === existingDest.id
        ? {
            ...a,
            quantity: a.quantity + transfer.quantity,
            originIdentifier:
              a.originIdentifier ?? sourceAsset.originIdentifier,
            originEvidence:
              a.originEvidence && a.originEvidence.length > 0
                ? a.originEvidence
                : sourceAsset.originEvidence,
            sourceLotIds: Array.from(
              new Set([...(a.sourceLotIds ?? []), ...derivedSourceLotIds])
            ),
          }
        : a
    )
  }

  const newAsset: Asset = {
    id: nextAssetId(),
    accountId: transfer.toAccountId,
    commodity: transfer.commodity,
    certifications: transfer.certifications,
    rating: transfer.rating,
    quantity: transfer.quantity,
    unit: "tons",
    sourceLotIds: derivedSourceLotIds,
    ...(sourceAsset.originIdentifier
      ? { originIdentifier: sourceAsset.originIdentifier }
      : {}),
    ...(sourceAsset.originEvidence
      ? { originEvidence: sourceAsset.originEvidence }
      : {}),
  }

  return [...updatedAssets, newAsset]
}

export function initiateTransfer(
  snapshot: CustodySnapshot,
  input: InitiateTransferRequest
): CustodySnapshot & { transfer: Transfer } {
  assertSenderPartyView(input.partyViewId, input.fromAccountId)

  if (input.fromAccountId === input.toAccountId) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Source and destination operational nodes must differ."
    )
  }

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Transfer quantity must be greater than zero. A split must conserve quantity: transferred + remaining equals the source quantity."
    )
  }

  const sourceAsset = snapshot.assets.find((a) => a.id === input.assetId)
  if (!sourceAsset || sourceAsset.accountId !== input.fromAccountId) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Selected lot position is not available at this operational node."
    )
  }

  // Anti-double-spend: cannot allocate beyond the remaining available balance
  // (the rest may be reserved by a pending transfer or already consumed).
  assertNoDoubleSpend(sourceAsset, snapshot.transfers, input.quantity)

  const attachments = normalizeAttachments(input.attachments)
  const now = new Date().toISOString()

  const transfer: Transfer = {
    id: nextTransferId(),
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    assetId: input.assetId,
    commodity: sourceAsset.commodity,
    certifications: sourceAsset.certifications,
    rating: sourceAsset.rating,
    quantity: input.quantity,
    unit: "tons",
    status: "pending",
    createdAt: now,
    sourceProvenanceRef: originFingerprint(sourceAsset),
    ...(attachments.length > 0 ? { attachments } : {}),
  }

  return {
    assets: snapshot.assets,
    transfers: [...snapshot.transfers, transfer],
    transfer,
  }
}

function assertPending(transfer: Transfer): void {
  if (transfer.status !== "pending") {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      `This custody transfer is already ${transfer.status}.`
    )
  }
}

export function acceptTransfer(
  snapshot: CustodySnapshot,
  input: TransferActionRequest
): CustodySnapshot & { transfer: Transfer } {
  const transfer = findTransfer(snapshot, input.transferId)
  assertRecipientPartyView(input.partyViewId, transfer.toAccountId)
  assertPending(transfer)

  const acceptedAt = new Date().toISOString()
  const acceptedTransfer: Transfer = {
    ...transfer,
    status: "accepted" as TransferStatus,
    occurredAt: acceptedAt,
  }

  const assets = applyAcceptedTransfer(snapshot.assets, acceptedTransfer)
  const transfers = snapshot.transfers.map((t) =>
    t.id === transfer.id ? acceptedTransfer : t
  )

  return { assets, transfers, transfer: acceptedTransfer }
}

export function rejectTransfer(
  snapshot: CustodySnapshot,
  input: TransferActionRequest
): CustodySnapshot & { transfer: Transfer } {
  const transfer = findTransfer(snapshot, input.transferId)
  assertRecipientPartyView(input.partyViewId, transfer.toAccountId)
  assertPending(transfer)

  const rejectedTransfer: Transfer = {
    ...transfer,
    status: "rejected",
    occurredAt: new Date().toISOString(),
  }

  const transfers = snapshot.transfers.map((t) =>
    t.id === transfer.id ? rejectedTransfer : t
  )

  return {
    assets: snapshot.assets,
    transfers,
    transfer: rejectedTransfer,
  }
}

export function transferHistoryForParty(
  snapshot: CustodySnapshot,
  partyViewId: string,
  operationalNodeId: string | null
): {
  sent: Transfer[]
  received: Transfer[]
  pendingInbound: Transfer[]
  pendingOutbound: Transfer[]
} {
  if (!operationalNodeId) {
    return { sent: [], received: [], pendingInbound: [], pendingOutbound: [] }
  }

  const visible = snapshot.transfers.filter(
    (t) =>
      t.fromAccountId === operationalNodeId ||
      t.toAccountId === operationalNodeId
  )

  const sortNewest = (items: Transfer[]) =>
    [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  return {
    sent: sortNewest(
      visible.filter(
        (t) => t.fromAccountId === operationalNodeId && t.status !== "pending"
      )
    ),
    received: sortNewest(
      visible.filter(
        (t) => t.toAccountId === operationalNodeId && t.status !== "pending"
      )
    ),
    pendingInbound: sortNewest(
      visible.filter(
        (t) => t.toAccountId === operationalNodeId && t.status === "pending"
      )
    ),
    pendingOutbound: sortNewest(
      visible.filter(
        (t) => t.fromAccountId === operationalNodeId && t.status === "pending"
      )
    ),
  }
}
