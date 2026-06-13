import {
  assertRecipientPartyView,
  assertSenderPartyView,
} from "@/lib/demo/party-view-auth"
import type {
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
  mapCustodyTransferToTransfer,
  mapLotPayloadToLedgerLot,
  mapLotPositionToAsset,
  mapTransferPayloadToLedgerTransfer,
  partyHintFromId,
  type LedgerCustodyTransfer,
  type LedgerLotPosition,
} from "@/lib/ledger/mappers"
import {
  partyHintForPartyView,
  resolvePartyId,
  resolvePartyIdForView,
} from "@/lib/ledger/party-config"
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

  // Resolve a single ledger-end offset so every party is read at the same
  // consistent snapshot (avoids mixing offsets across multi-party reads).
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

function lotsToAssets(lots: LedgerLotPosition[]): Asset[] {
  return lots.map((lot) =>
    mapLotPositionToAsset(lot, partyHintFromId(lot.owner)),
  )
}

function transfersToDomain(transfers: LedgerCustodyTransfer[]): Transfer[] {
  return transfers.map(mapCustodyTransferToTransfer)
}

function buildSnapshot(
  lots: LedgerLotPosition[],
  transfers: LedgerCustodyTransfer[],
): CustodySnapshot {
  return {
    assets: lotsToAssets(lots),
    transfers: transfersToDomain(transfers),
  }
}

async function snapshotForPartyViews(
  client: LedgerClient,
  partyViewIds: string[],
): Promise<CustodySnapshot> {
  const partyIds = await Promise.all(
    partyViewIds.map((viewId) => resolvePartyIdForView(client, viewId)),
  )
  const state = await queryLedgerState(client, partyIds)
  return buildSnapshot(state.lots, state.transfers)
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
  const state = await queryLedgerState(client, [partyId])
  const transfers = transfersToDomain(state.transfers).filter(
    (transfer) =>
      transfer.fromAccountId === nodeId || transfer.toAccountId === nodeId,
  )

  const sortNewest = (items: Transfer[]) =>
    [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  return {
    sent: sortNewest(
      transfers.filter(
        (transfer) =>
          transfer.fromAccountId === nodeId && transfer.status !== "pending",
      ),
    ),
    received: sortNewest(
      transfers.filter(
        (transfer) =>
          transfer.toAccountId === nodeId && transfer.status !== "pending",
      ),
    ),
    pendingInbound: sortNewest(
      transfers.filter(
        (transfer) =>
          transfer.toAccountId === nodeId && transfer.status === "pending",
      ),
    ),
    pendingOutbound: sortNewest(
      transfers.filter(
        (transfer) =>
          transfer.fromAccountId === nodeId && transfer.status === "pending",
      ),
    ),
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

  // Mint the transferId up front so we can read the exact contract back by id
  // rather than guessing via (from, to, quantity) heuristics.
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

  // Read back only the acting party's own state. Canton's per-party visibility
  // is enforced by querying as the sender alone — never the counterparty —
  // so the response cannot leak the receiver's holdings to the sender's UI.
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

  const response = await client.submitAndWaitForTransaction(
    [partyId],
    [partyId, ledgerTransfer.sender],
    [
      {
        ExerciseCommand: {
          templateId: custodyTransferTemplateId(client),
          contractId: ledgerTransfer.contractId,
          choice: "AcceptTransfer",
          choiceArgument: {},
        },
      },
    ],
    nextCommandId("accept"),
  )

  // Read back only the acting party's state (no counterparty leak). The
  // CustodyTransfer is consumed by AcceptTransfer, so the result transfer is
  // derived from the pre-action contract plus the committed outcome: the
  // command succeeded, therefore status is accepted, and occurredAt comes from
  // the ledger's effective time rather than the gateway clock.
  const snapshot = await snapshotForPartyViews(client, [input.partyViewId])

  const transfer: Transfer = {
    ...mapCustodyTransferToTransfer(ledgerTransfer),
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

  const response = await client.submitAndWaitForTransaction(
    [partyId],
    [partyId, ledgerTransfer.sender],
    [
      {
        ExerciseCommand: {
          templateId: custodyTransferTemplateId(client),
          contractId: ledgerTransfer.contractId,
          choice: "RejectTransfer",
          choiceArgument: {},
        },
      },
    ],
    nextCommandId("reject"),
  )

  // Acting party (receiver) state only; reserved quantity returns to the
  // sender so it correctly disappears from the receiver's read-back.
  const snapshot = await snapshotForPartyViews(client, [input.partyViewId])

  const transfer: Transfer = {
    ...mapCustodyTransferToTransfer(ledgerTransfer),
    status: "rejected",
    occurredAt: transactionTime(response),
  }

  return { ...snapshot, transfer }
}
