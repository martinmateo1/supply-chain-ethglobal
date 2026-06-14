import {
  mapCustodyTransferToTransfer,
  mapTransferPayloadToLedgerTransfer,
  partyHintFromId,
  type LedgerCustodyTransfer,
} from "@/lib/ledger/mappers"
import type { Transfer } from "@/lib/types"

export type FlatLedgerEvent = {
  contractId: string
  templateId: string
  kind: "created" | "archived"
  createArgument?: Record<string, unknown>
  createdAt?: string
  effectiveAt?: string
  choice?: string
}

function isCustodyTransferTemplate(templateId: string): boolean {
  return templateId.endsWith(":Commodity.LotPosition:CustodyTransfer")
}

function isLotPositionTemplate(templateId: string): boolean {
  return templateId.endsWith(":Commodity.LotPosition:LotPosition")
}

function eventChoice(event: Record<string, unknown>): string | undefined {
  const archived = event.ArchivedEvent as Record<string, unknown> | undefined
  const choice = archived?.choice
  return typeof choice === "string" ? choice : undefined
}

function parseCreatedEvent(
  event: Record<string, unknown>,
  effectiveAt?: string,
): FlatLedgerEvent | null {
  const created = event.CreatedEvent as Record<string, unknown> | undefined
  if (!created?.contractId || !created.templateId) return null
  return {
    contractId: String(created.contractId),
    templateId: String(created.templateId),
    kind: "created",
    createArgument: (created.createArgument as Record<string, unknown>) ?? {},
    createdAt:
      typeof created.createdAt === "string" ? created.createdAt : effectiveAt,
    effectiveAt,
  }
}

function parseArchivedEvent(
  event: Record<string, unknown>,
  effectiveAt?: string,
): FlatLedgerEvent | null {
  const archived = event.ArchivedEvent as Record<string, unknown> | undefined
  if (!archived?.contractId || !archived.templateId) return null
  return {
    contractId: String(archived.contractId),
    templateId: String(archived.templateId),
    kind: "archived",
    effectiveAt,
    choice: eventChoice(event),
  }
}

export function flattenUpdateRows(rows: unknown[]): FlatLedgerEvent[] {
  const events: FlatLedgerEvent[] = []

  for (const row of rows) {
    if (!row || typeof row !== "object") continue
    const update = (row as Record<string, unknown>).update as
      | Record<string, unknown>
      | undefined
    const transaction = update?.Transaction as
      | Record<string, unknown>
      | undefined
    const txValue = transaction?.value as Record<string, unknown> | undefined
    const effectiveAt =
      typeof txValue?.effectiveAt === "string"
        ? txValue.effectiveAt
        : undefined
    const txEvents = txValue?.events
    if (!Array.isArray(txEvents)) continue

    for (const event of txEvents) {
      if (!event || typeof event !== "object") continue
      const created = parseCreatedEvent(
        event as Record<string, unknown>,
        effectiveAt,
      )
      if (created) events.push(created)
      const archived = parseArchivedEvent(
        event as Record<string, unknown>,
        effectiveAt,
      )
      if (archived) events.push(archived)
    }
  }

  return events
}

type CompletedTransfer = {
  ledgerTransfer: LedgerCustodyTransfer
  status: "accepted" | "rejected"
  occurredAt: string
}

function lotOwnerFromCreated(event: FlatLedgerEvent): string | null {
  if (!isLotPositionTemplate(event.templateId) || !event.createArgument) {
    return null
  }
  const owner = event.createArgument.owner
  return typeof owner === "string" ? owner : null
}

export function foldCompletedCustodyTransfers(
  rows: unknown[],
): CompletedTransfer[] {
  const createdTransfers = new Map<string, LedgerCustodyTransfer>()

  const allEvents = flattenUpdateRows(rows)
  for (const event of allEvents) {
    if (
      event.kind === "created" &&
      isCustodyTransferTemplate(event.templateId) &&
      event.createArgument
    ) {
      createdTransfers.set(
        event.contractId,
        mapTransferPayloadToLedgerTransfer(
          event.contractId,
          event.createArgument,
          event.createdAt,
        ),
      )
    }
  }

  return foldCompletedCustodyTransfersAfterIndex(rows, createdTransfers)
}

function foldCompletedCustodyTransfersAfterIndex(
  rows: unknown[],
  createdTransfers: Map<string, LedgerCustodyTransfer>,
): CompletedTransfer[] {
  const completed: CompletedTransfer[] = []

  for (const row of rows) {
    const events = flattenUpdateRows([row])
    const archivedTransfer = events.find(
      (event) =>
        event.kind === "archived" && isCustodyTransferTemplate(event.templateId),
    )
    if (!archivedTransfer) continue

    const ledgerTransfer = createdTransfers.get(archivedTransfer.contractId)
    if (!ledgerTransfer) continue

    const createdLots = events.filter(
      (event) =>
        event.kind === "created" && isLotPositionTemplate(event.templateId),
    )
    const receiverLot = createdLots.find(
      (event) => lotOwnerFromCreated(event) === ledgerTransfer.receiver,
    )
    const senderLot = createdLots.find(
      (event) => lotOwnerFromCreated(event) === ledgerTransfer.sender,
    )

    const occurredAt =
      archivedTransfer.effectiveAt ??
      archivedTransfer.createdAt ??
      new Date().toISOString()

    if (receiverLot) {
      completed.push({
        ledgerTransfer,
        status: "accepted",
        occurredAt,
      })
    } else if (senderLot) {
      completed.push({
        ledgerTransfer,
        status: "rejected",
        occurredAt,
      })
    }
  }

  return completed
}

export function completedTransfersForParty(
  completed: CompletedTransfer[],
  nodeId: string,
): {
  sent: Transfer[]
  received: Transfer[]
} {
  const sent: Transfer[] = []
  const received: Transfer[] = []

  for (const item of completed) {
    const transfer = mapCustodyTransferToTransfer({
      ...item.ledgerTransfer,
      status: item.status === "accepted" ? "Completed" : "Rejected",
      createdAt: item.occurredAt,
    })
    const from = partyHintFromId(item.ledgerTransfer.sender)
    const to = partyHintFromId(item.ledgerTransfer.receiver)
    const mapped: Transfer = {
      ...transfer,
      status: item.status,
      occurredAt: item.occurredAt,
      createdAt: item.occurredAt,
    }

    if (from === nodeId) sent.push(mapped)
    if (to === nodeId) received.push(mapped)
  }

  return { sent, received }
}
