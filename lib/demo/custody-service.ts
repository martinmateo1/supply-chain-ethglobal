/**
 * Demo custody business logic — authoritative rules for MVP gateway + store.
 * Future Canton adapter replaces internals; gateway boundary stays stable.
 */
import {
  assertRecipientPartyView,
  assertSenderPartyView,
} from "@/lib/demo/party-view-auth"
import { originFingerprint } from "@/lib/provenance"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import type {
  Asset,
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

  const updatedAssets = assets
    .map((a) => {
      if (a.id === transfer.assetId) {
        return { ...a, quantity: a.quantity - transfer.quantity }
      }
      return a
    })
    .filter((a) => a.quantity > 0)

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
      "Transfer quantity must be greater than zero."
    )
  }

  const sourceAsset = snapshot.assets.find((a) => a.id === input.assetId)
  if (!sourceAsset || sourceAsset.accountId !== input.fromAccountId) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Selected lot position is not available at this operational node."
    )
  }

  const available = availableQuantityForAsset(sourceAsset, snapshot.transfers)
  if (input.quantity > available) {
    const reserved = reservedQuantityForAsset(sourceAsset.id, snapshot.transfers)
    const message =
      reserved > 0
        ? "This quantity is locked by a pending custody transfer. Reduce the amount or wait for the recipient to accept or reject."
        : "Transfer quantity cannot exceed the available quantity in the source lot position."

    throw new LedgerError(LedgerErrorCode.INSUFFICIENT_QUANTITY, message)
  }

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
