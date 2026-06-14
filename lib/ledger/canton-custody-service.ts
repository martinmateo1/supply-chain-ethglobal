import {
  assertOriginLotProducer,
  assertRecipientPartyView,
  assertSenderPartyView,
} from "@/lib/demo/party-view-auth"
import type {
  CreateLotRequest,
  CustodySnapshot,
  InitiateTransferRequest,
  TransferActionRequest,
} from "@/lib/demo/custody-service"
import {
  createLedgerClient,
  custodyTransferTemplateId,
  lotPositionTemplateId,
  type LedgerClient,
} from "@/lib/ledger/client"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import {
  registerEvidenceMetadata,
  loadEvidenceMetadataStore,
} from "@/lib/ledger/evidence-metadata-store"
import {
  mapCustodyTransferToTransfer,
  mapLotPayloadToLedgerLot,
  mapLotPositionToAsset,
  mapTransferPayloadToLedgerTransfer,
  partyHintFromId,
  toDamlCertification,
  toDamlCommodity,
  toDamlProvenanceEntry,
  toDamlQualityGrade,
  type LedgerCustodyTransfer,
  type LedgerLotPosition,
} from "@/lib/ledger/mappers"
import {
  partyHintForPartyView,
  resolvePartyId,
  resolvePartyIdForView,
} from "@/lib/ledger/party-config"
import {
  completedTransfersForParty,
  flattenUpdateRows,
  foldCompletedCustodyTransfers,
} from "@/lib/ledger/transaction-history"
import type { Asset, Transfer, TransferAttachment } from "@/lib/types"

let cachedClient: LedgerClient | null = null

function getClient(): LedgerClient {
  if (!cachedClient) {
    cachedClient = createLedgerClient()
  }
  return cachedClient
}

function uniqueParties(parties: string[]): string[] {
  return [...new Set(parties)]
}

function isLotTemplate(templateId: string): boolean {
  return templateId.endsWith(":Commodity.LotPosition:LotPosition")
}

function isTransferTemplate(templateId: string): boolean {
  return templateId.endsWith(":Commodity.LotPosition:CustodyTransfer")
}

async function queryLedgerState(
  client: LedgerClient,
  partyIds: string[],
): Promise<{ lots: LedgerLotPosition[]; transfers: LedgerCustodyTransfer[] }> {
  const lotMap = new Map<string, LedgerLotPosition>()
  const transferMap = new Map<string, LedgerCustodyTransfer>()

  const offset = await client.getLedgerEndOffset()

  for (const partyId of uniqueParties(partyIds)) {
    const rows = await client.queryActiveContracts(partyId, offset)
    for (const row of rows) {
      const created = row.contractEntry?.JsActiveContract?.createdEvent
      if (!created?.contractId || !created.templateId || !created.createArgument) {
        continue
      }

      if (isLotTemplate(created.templateId)) {
        lotMap.set(
          created.contractId,
          mapLotPayloadToLedgerLot(created.contractId, created.createArgument),
        )
      }

      if (isTransferTemplate(created.templateId)) {
        transferMap.set(
          created.contractId,
          mapTransferPayloadToLedgerTransfer(
            created.contractId,
            created.createArgument,
            created.createdAt,
          ),
        )
      }
    }
  }

  return {
    lots: [...lotMap.values()],
    transfers: [...transferMap.values()],
  }
}

async function queryCompletedTransfers(
  client: LedgerClient,
  partyId: string,
): Promise<ReturnType<typeof foldCompletedCustodyTransfers>> {
  const rows = await client.queryUpdateFlats(partyId)
  const events = flattenUpdateRows(rows)
  return foldCompletedCustodyTransfers(events)
}

function lotsToAssets(
  lots: LedgerLotPosition[],
  metadataByHash: Record<string, import("@/lib/ledger/evidence-metadata-store").StoredEvidenceMetadata>,
): Asset[] {
  return lots.map((lot) =>
    mapLotPositionToAsset(lot, partyHintFromId(lot.owner), metadataByHash),
  )
}

function transfersToDomain(
  transfers: LedgerCustodyTransfer[],
  metadataByHash: Record<string, import("@/lib/ledger/evidence-metadata-store").StoredEvidenceMetadata>,
): Transfer[] {
  return transfers.map((transfer) =>
    mapCustodyTransferToTransfer(transfer, metadataByHash),
  )
}

function buildSnapshot(
  lots: LedgerLotPosition[],
  transfers: LedgerCustodyTransfer[],
  metadataByHash: Record<string, import("@/lib/ledger/evidence-metadata-store").StoredEvidenceMetadata>,
): CustodySnapshot {
  return {
    assets: lotsToAssets(lots, metadataByHash),
    transfers: transfersToDomain(transfers, metadataByHash),
  }
}

async function snapshotForPartyViews(
  client: LedgerClient,
  partyViewIds: string[],
): Promise<CustodySnapshot> {
  const partyIds = await Promise.all(
    partyViewIds.map((viewId) => resolvePartyIdForView(client, viewId)),
  )
  const [state, metadataByHash] = await Promise.all([
    queryLedgerState(client, partyIds),
    loadEvidenceMetadataStore(),
  ])
  return buildSnapshot(state.lots, state.transfers, metadataByHash)
}

function normalizeAttachments(
  attachments: TransferAttachment[] | undefined,
): string[] {
  if (!attachments?.length) return []
  return attachments.map((attachment) => {
    if (!attachment.hash?.trim()) {
      throw new LedgerError(
        LedgerErrorCode.EVIDENCE_REFERENCE_INVALID,
        "Each evidence reference must include a content hash.",
      )
    }
    return attachment.hash.trim()
  })
}

function findTransferContract(
  transfers: LedgerCustodyTransfer[],
  transferId: string,
): LedgerCustodyTransfer {
  const transfer = transfers.find((item) => item.transferId === transferId)
  if (!transfer) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Custody transfer not found.",
    )
  }
  return transfer
}

function nextCommandId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function transactionTime(response: {
  transaction?: { effectiveAt?: string }
}): string {
  return response.transaction?.effectiveAt ?? new Date().toISOString()
}

function dedupeTransfers(transfers: Transfer[]): Transfer[] {
  const map = new Map<string, Transfer>()
  for (const transfer of transfers) {
    map.set(transfer.id, transfer)
  }
  return [...map.values()]
}

export async function cantonVisibleHoldings(
  partyViewId: string,
): Promise<CustodySnapshot> {
  const client = getClient()
  return snapshotForPartyViews(client, [partyViewId])
}

export async function cantonTransferHistory(
  partyViewId: string,
): Promise<{
  sent: Transfer[]
  received: Transfer[]
  pendingInbound: Transfer[]
  pendingOutbound: Transfer[]
}> {
  const client = getClient()
  const nodeId = partyHintForPartyView(partyViewId)
  const partyId = await resolvePartyId(client, nodeId)
  const [state, completed, metadataByHash] = await Promise.all([
    queryLedgerState(client, [partyId]),
    queryCompletedTransfers(client, partyId),
    loadEvidenceMetadataStore(),
  ])

  const active = transfersToDomain(state.transfers, metadataByHash).filter(
    (transfer) =>
      transfer.fromAccountId === nodeId || transfer.toAccountId === nodeId,
  )

  const historical = completedTransfersForParty(completed, nodeId)
  const metadataHistorical = {
    sent: historical.sent.map((transfer) => ({
      ...transfer,
      attachments: transfer.attachments?.map((attachment) => {
        const metadata = metadataByHash[attachment.hash]
        return metadata
          ? { ...attachment, name: metadata.name, mimeType: metadata.mimeType, size: metadata.size }
          : attachment
      }),
    })),
    received: historical.received.map((transfer) => ({
      ...transfer,
      attachments: transfer.attachments?.map((attachment) => {
        const metadata = metadataByHash[attachment.hash]
        return metadata
          ? { ...attachment, name: metadata.name, mimeType: metadata.mimeType, size: metadata.size }
          : attachment
      }),
    })),
  }

  const sent = dedupeTransfers([
    ...metadataHistorical.sent,
    ...active.filter(
      (transfer) =>
        transfer.fromAccountId === nodeId && transfer.status !== "pending",
    ),
  ])
  const received = dedupeTransfers([
    ...metadataHistorical.received,
    ...active.filter(
      (transfer) =>
        transfer.toAccountId === nodeId && transfer.status !== "pending",
    ),
  ])
  const pendingInbound = active.filter(
    (transfer) =>
      transfer.toAccountId === nodeId && transfer.status === "pending",
  )
  const pendingOutbound = active.filter(
    (transfer) =>
      transfer.fromAccountId === nodeId && transfer.status === "pending",
  )

  const sortNewest = (items: Transfer[]) =>
    [...items].sort(
      (a, b) =>
        new Date(b.occurredAt ?? b.createdAt).getTime() -
        new Date(a.occurredAt ?? a.createdAt).getTime(),
    )

  return {
    sent: sortNewest(sent),
    received: sortNewest(received),
    pendingInbound: sortNewest(pendingInbound),
    pendingOutbound: sortNewest(pendingOutbound),
  }
}

export async function cantonInitiateTransfer(
  input: InitiateTransferRequest,
): Promise<CustodySnapshot & { transfer: Transfer }> {
  assertSenderPartyView(input.partyViewId, input.fromAccountId)

  const client = getClient()
  const senderParty = await resolvePartyIdForView(client, input.partyViewId)
  const receiverParty = await resolvePartyId(client, input.toAccountId)

  const evidenceHashes = normalizeAttachments(input.attachments)
  await registerEvidenceMetadata(input.attachments)

  const transferId = `t-${nextCommandId("xfer")}`

  await client.submitAndWaitForTransaction(
    [senderParty],
    [senderParty, receiverParty],
    [
      {
        ExerciseCommand: {
          templateId: lotPositionTemplateId(client),
          contractId: input.assetId,
          choice: "InitiateTransfer",
          choiceArgument: {
            receiver: receiverParty,
            transferId,
            transferAmount: String(input.quantity),
            evidenceHashes,
          },
        },
      },
    ],
    nextCommandId("initiate"),
  )

  const snapshot = await snapshotForPartyViews(client, [input.partyViewId])
  const transfer = snapshot.transfers.find((item) => item.id === transferId)

  if (!transfer) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Transfer was submitted but could not be read back from the ledger.",
    )
  }

  return { ...snapshot, transfer }
}

export async function cantonAcceptTransfer(
  input: TransferActionRequest,
): Promise<CustodySnapshot & { transfer: Transfer }> {
  const client = getClient()
  const partyId = await resolvePartyIdForView(client, input.partyViewId)
  const state = await queryLedgerState(client, [partyId])
  const ledgerTransfer = findTransferContract(state.transfers, input.transferId)

  assertRecipientPartyView(
    input.partyViewId,
    partyHintFromId(ledgerTransfer.receiver),
  )

  const occurredAt = new Date().toISOString()
  const response = await client.submitAndWaitForTransaction(
    [partyId],
    [partyId, ledgerTransfer.sender],
    [
      {
        ExerciseCommand: {
          templateId: custodyTransferTemplateId(client),
          contractId: ledgerTransfer.contractId,
          choice: "AcceptTransfer",
          choiceArgument: { occurredAt },
        },
      },
    ],
    nextCommandId("accept"),
  )

  const snapshot = await snapshotForPartyViews(client, [input.partyViewId])
  const metadataByHash = await loadEvidenceMetadataStore()

  const transfer: Transfer = {
    ...mapCustodyTransferToTransfer(ledgerTransfer, metadataByHash),
    status: "accepted",
    occurredAt: transactionTime(response),
  }

  return { ...snapshot, transfer }
}

export async function cantonRejectTransfer(
  input: TransferActionRequest,
): Promise<CustodySnapshot & { transfer: Transfer }> {
  const client = getClient()
  const partyId = await resolvePartyIdForView(client, input.partyViewId)
  const state = await queryLedgerState(client, [partyId])
  const ledgerTransfer = findTransferContract(state.transfers, input.transferId)

  assertRecipientPartyView(
    input.partyViewId,
    partyHintFromId(ledgerTransfer.receiver),
  )

  const occurredAt = new Date().toISOString()
  const response = await client.submitAndWaitForTransaction(
    [partyId],
    [partyId, ledgerTransfer.sender],
    [
      {
        ExerciseCommand: {
          templateId: custodyTransferTemplateId(client),
          contractId: ledgerTransfer.contractId,
          choice: "RejectTransfer",
          choiceArgument: { occurredAt },
        },
      },
    ],
    nextCommandId("reject"),
  )

  const snapshot = await snapshotForPartyViews(client, [input.partyViewId])
  const metadataByHash = await loadEvidenceMetadataStore()

  const transfer: Transfer = {
    ...mapCustodyTransferToTransfer(ledgerTransfer, metadataByHash),
    status: "rejected",
    occurredAt: transactionTime(response),
  }

  return { ...snapshot, transfer }
}

export async function cantonCreateLot(
  input: CreateLotRequest,
): Promise<CustodySnapshot & { asset: Asset }> {
  assertOriginLotProducer(input.partyViewId, input.accountId)

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Lot quantity must be greater than zero.",
    )
  }

  const originIdentifier = input.originIdentifier.trim()
  if (!originIdentifier) {
    throw new LedgerError(
      LedgerErrorCode.EVIDENCE_REFERENCE_INVALID,
      "Origin identifier is required to create a lot on the ledger.",
    )
  }

  if (!input.certifications.length) {
    throw new LedgerError(
      LedgerErrorCode.EVIDENCE_REFERENCE_INVALID,
      "At least one certification label is required.",
    )
  }

  const client = getClient()
  const ownerParty = await resolvePartyIdForView(client, input.partyViewId)
  const lotId = `lot-${nextCommandId("create")}`
  const evidenceHashes = normalizeAttachments(input.attachments)
  await registerEvidenceMetadata(input.attachments)

  const createdAt = new Date().toISOString()
  const originProvenance = [
    toDamlProvenanceEntry({
      fromParty: ownerParty,
      toParty: ownerParty,
      transferId: lotId,
      evidenceHashes,
      occurredAt: createdAt,
    }),
  ]

  const response = await client.submitAndWaitForTransaction(
    [ownerParty],
    [ownerParty],
    [
      {
        CreateCommand: {
          templateId: lotPositionTemplateId(client),
          createArguments: {
            owner: ownerParty,
            lotId,
            commodity: toDamlCommodity(input.commodity),
            quantity: { amount: String(input.quantity), unit: "tons" },
            certifications: input.certifications.map(toDamlCertification),
            quality: toDamlQualityGrade(input.rating),
            originIdentifier,
            provenance: originProvenance,
          },
        },
      },
    ],
    nextCommandId("create-lot"),
  )

  const createdEvent = response.transaction?.events?.find((event) =>
    event.CreatedEvent?.templateId?.endsWith(
      ":Commodity.LotPosition:LotPosition",
    ),
  )
  const contractId = createdEvent?.CreatedEvent?.contractId
  if (!contractId) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Lot was submitted but could not be read back from the ledger.",
    )
  }

  const snapshot = await snapshotForPartyViews(client, [input.partyViewId])
  const asset = snapshot.assets.find((item) => item.id === contractId)
  if (!asset) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_COMMAND_FAILED,
      "Created lot is not visible to this Party View.",
    )
  }

  return { ...snapshot, asset }
}
