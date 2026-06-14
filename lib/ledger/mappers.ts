import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import {
  mapLedgerProvenanceToCustodyChain,
  parseLedgerProvenancePayload,
} from "@/lib/ledger/custody-chain"
import type {
  StoredEvidenceMetadata,
} from "@/lib/ledger/evidence-metadata-store"
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
  provenance: ReturnType<typeof parseLedgerProvenancePayload>
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
  provenance: ReturnType<typeof parseLedgerProvenancePayload>
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

export function toDamlCommodity(value: Asset["commodity"]): string {
  return value === "cacao" ? "Cacao" : "Coffee"
}

export function toDamlCertification(value: Certification): string {
  return value === "deforestation-free" ? "DeforestationFree" : "NonGMO"
}

export function toDamlQualityGrade(value: Rating): string {
  if (value === "B") return "GradeB"
  if (value === "C") return "GradeC"
  return "GradeA"
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
    provenance: parseLedgerProvenancePayload(payload.provenance),
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
    provenance: parseLedgerProvenancePayload(payload.provenance),
    status: parseTransferStatus(payload.status ?? "Pending"),
    createdAt,
  }
}

function evidenceAttachments(
  transferId: string,
  hashes: string[],
  metadataByHash?: Record<string, StoredEvidenceMetadata>,
): TransferAttachment[] {
  return hashes.map((hash, index) => {
    const metadata = metadataByHash?.[hash]
    return {
      id: `att-${transferId}-${index}`,
      name: metadata?.name ?? hash,
      mimeType: metadata?.mimeType ?? "application/octet-stream",
      size: metadata?.size ?? 0,
      hash,
      ...(metadata?.documentType
        ? { documentType: metadata.documentType }
        : {}),
      ...(metadata?.issuer ? { issuer: metadata.issuer } : {}),
      ...(metadata?.timestamp ? { timestamp: metadata.timestamp } : {}),
    }
  })
}

export function mapLotPositionToAsset(
  lot: LedgerLotPosition,
  accountId: string,
  metadataByHash?: Record<string, StoredEvidenceMetadata>,
): Asset {
  const custodyChain = mapLedgerProvenanceToCustodyChain(lot.provenance)
  const originHashes = custodyChain[0]?.evidenceHashes ?? []

  return {
    id: lot.contractId,
    lotId: lot.lotId,
    accountId,
    commodity: mapCommodity(lot.commodity),
    certifications: lot.certifications.map(mapCertification),
    rating: mapRating(lot.quality),
    quantity: parseAmount(lot.amount, "lot quantity"),
    unit: "tons",
    ...(lot.originIdentifier ? { originIdentifier: lot.originIdentifier } : {}),
    ...(originHashes.length > 0
      ? {
          originEvidence: evidenceAttachments(
            lot.lotId,
            originHashes,
            metadataByHash,
          ),
        }
      : {}),
    ...(custodyChain.length > 0 ? { custodyChain } : {}),
  }
}

export function mapCustodyTransferToTransfer(
  transfer: LedgerCustodyTransfer,
  metadataByHash?: Record<string, StoredEvidenceMetadata>,
): Transfer {
  const attachments = evidenceAttachments(
    transfer.transferId,
    transfer.evidenceHashes,
    metadataByHash,
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

export function toDamlProvenanceEntry(
  entry: {
    fromParty: string
    toParty: string
    transferId: string
    evidenceHashes: string[]
    occurredAt: string
  },
): Record<string, unknown> {
  return {
    fromParty: entry.fromParty,
    toParty: entry.toParty,
    transferId: entry.transferId,
    evidenceHashes: entry.evidenceHashes,
    occurredAt: entry.occurredAt,
  }
}
