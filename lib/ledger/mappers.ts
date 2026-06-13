import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import type { Asset, Certification, Rating, Transfer, TransferAttachment } from "@/lib/types"

export type LedgerLotPosition = {
  contractId: string
  owner: string
  lotId: string
  commodity: string
  amount: string
  unit: string
  certifications: string[]
  quality: string
  originIdentifier?: string | null
}

export type LedgerCustodyTransfer = {
  contractId: string
  transferId: string
  sender: string
  receiver: string
  commodity: string
  amount: string
  unit: string
  certifications: string[]
  quality: string
  originIdentifier?: string | null
  sourceLotId: string
  evidenceHashes: string[]
  status: "Pending" | "Completed" | "Rejected"
  createdAt?: string
}

function corrupt(field: string, value: unknown): never {
  throw new LedgerError(
    LedgerErrorCode.LEDGER_COMMAND_FAILED,
    `Ledger contract carried an unexpected ${field} value: ${String(value)}.`,
  )
}

function mapCommodity(value: string): Asset["commodity"] {
  if (value === "Coffee") return "coffee"
  if (value === "Cacao") return "cacao"
  return corrupt("commodity", value)
}

function mapCertification(value: string): Certification {
  if (value === "DeforestationFree") return "deforestation-free"
  if (value === "NonGMO") return "non-gmo"
  return corrupt("certification", value)
}

function mapRating(value: string): Rating {
  if (value === "GradeA") return "A"
  if (value === "GradeB") return "B"
  if (value === "GradeC") return "C"
  return corrupt("quality grade", value)
}

const TRANSFER_STATUSES: ReadonlyArray<LedgerCustodyTransfer["status"]> = [
  "Pending",
  "Completed",
  "Rejected",
]

function parseTransferStatus(value: unknown): LedgerCustodyTransfer["status"] {
  if (
    typeof value === "string" &&
    (TRANSFER_STATUSES as readonly string[]).includes(value)
  ) {
    return value as LedgerCustodyTransfer["status"]
  }
  return corrupt("transfer status", value)
}

function parseAmount(value: string, field: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) {
    return corrupt(field, value)
  }
  return parsed
}

function mapTransferStatus(
  value: LedgerCustodyTransfer["status"],
): Transfer["status"] {
  if (value === "Pending") return "pending"
  if (value === "Rejected") return "rejected"
  return "accepted"
}

export function partyHintFromId(partyId: string): string {
  return partyId.split("::")[0] ?? partyId
}

export function mapLotPayloadToLedgerLot(
  contractId: string,
  payload: Record<string, unknown>,
): LedgerLotPosition {
  const quantity = payload.quantity as { amount?: string; unit?: string }
  return {
    contractId,
    owner: String(payload.owner ?? ""),
    lotId: String(payload.lotId ?? contractId),
    commodity: String(payload.commodity ?? "Coffee"),
    amount: String(quantity?.amount ?? "0"),
    unit: String(quantity?.unit ?? "tons"),
    certifications: Array.isArray(payload.certifications)
      ? payload.certifications.map(String)
      : [],
    quality: String(payload.quality ?? "GradeA"),
    originIdentifier:
      payload.originIdentifier === null || payload.originIdentifier === undefined
        ? null
        : String(payload.originIdentifier),
  }
}

export function mapTransferPayloadToLedgerTransfer(
  contractId: string,
  payload: Record<string, unknown>,
  createdAt?: string,
): LedgerCustodyTransfer {
  const quantity = payload.quantity as { amount?: string; unit?: string }
  return {
    contractId,
    transferId: String(payload.transferId ?? contractId),
    sender: String(payload.sender ?? ""),
    receiver: String(payload.receiver ?? ""),
    commodity: String(payload.commodity ?? "Coffee"),
    amount: String(quantity?.amount ?? "0"),
    unit: String(quantity?.unit ?? "tons"),
    certifications: Array.isArray(payload.certifications)
      ? payload.certifications.map(String)
      : [],
    quality: String(payload.quality ?? "GradeA"),
    originIdentifier:
      payload.originIdentifier === null || payload.originIdentifier === undefined
        ? null
        : String(payload.originIdentifier),
    sourceLotId: String(payload.sourceLotId ?? ""),
    evidenceHashes: Array.isArray(payload.evidenceHashes)
      ? payload.evidenceHashes.map(String)
      : [],
    status: parseTransferStatus(payload.status ?? "Pending"),
    createdAt,
  }
}

export function mapLotPositionToAsset(
  lot: LedgerLotPosition,
  accountId: string,
): Asset {
  return {
    id: lot.contractId,
    accountId,
    commodity: mapCommodity(lot.commodity),
    certifications: lot.certifications.map(mapCertification),
    rating: mapRating(lot.quality),
    quantity: parseAmount(lot.amount, "lot quantity"),
    unit: "tons",
    ...(lot.originIdentifier ? { originIdentifier: lot.originIdentifier } : {}),
  }
}

export function mapCustodyTransferToTransfer(
  transfer: LedgerCustodyTransfer,
): Transfer {
  const attachments: TransferAttachment[] = transfer.evidenceHashes.map(
    (hash, index) => ({
      id: `att-${transfer.transferId}-${index}`,
      name: `evidence-${index + 1}`,
      mimeType: "application/octet-stream",
      size: 0,
      hash,
    }),
  )

  return {
    id: transfer.transferId,
    fromAccountId: partyHintFromId(transfer.sender),
    toAccountId: partyHintFromId(transfer.receiver),
    assetId: transfer.sourceLotId,
    commodity: mapCommodity(transfer.commodity),
    certifications: transfer.certifications.map(mapCertification),
    rating: mapRating(transfer.quality),
    quantity: parseAmount(transfer.amount, "transfer quantity"),
    unit: "tons",
    status: mapTransferStatus(transfer.status),
    createdAt: transfer.createdAt ?? new Date().toISOString(),
    ...(transfer.originIdentifier
      ? { sourceProvenanceRef: transfer.originIdentifier }
      : {}),
    ...(attachments.length > 0 ? { attachments } : {}),
  }
}
