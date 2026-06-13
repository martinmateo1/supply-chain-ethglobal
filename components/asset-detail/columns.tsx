"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

import type { Account, OriginEvidenceReference, Transfer } from "@/lib/types"
import { formatTons } from "@/lib/utils"

export type TransferEvidenceRow = {
  id: string
  name: string
  mimeType: string
  size: number
  hash: string
  transferId: string
}

type CustodyActivityContext = {
  accountById: (id: string) => Account | undefined
  visibilityPartyId: string
  assetAccountId: string
}

function formatTransferDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate))
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function transferDirection(
  transfer: Transfer,
  visibilityPartyId: string,
  assetAccountId: string
): "sent" | "received" {
  if (transfer.toAccountId === visibilityPartyId) return "received"
  if (transfer.fromAccountId === visibilityPartyId) return "sent"
  if (assetAccountId === visibilityPartyId) {
    return transfer.toAccountId === assetAccountId ? "received" : "sent"
  }
  return "sent"
}

export function createCustodyActivityColumns({
  accountById,
  visibilityPartyId,
  assetAccountId,
}: CustodyActivityContext): ColumnDef<Transfer>[] {
  return [
    {
      id: "direction",
      header: "Direction",
      cell: ({ row }) => {
        const transfer = row.original
        const direction = transferDirection(
          transfer,
          visibilityPartyId,
          assetAccountId
        )
        const DirectionIcon =
          direction === "sent" ? ArrowUpRight : ArrowDownLeft

        return (
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <DirectionIcon className="size-3.5 text-muted-foreground" />
            </div>
            <span className="capitalize">{direction}</span>
          </div>
        )
      },
    },
    {
      id: "counterparty",
      header: "Counterparty",
      cell: ({ row }) => {
        const transfer = row.original
        const direction = transferDirection(
          transfer,
          visibilityPartyId,
          assetAccountId
        )
        const counterpartyId =
          direction === "sent"
            ? transfer.toAccountId
            : transfer.fromAccountId
        const counterparty = accountById(counterpartyId)

        return (
          <span className="font-medium">
            {counterparty?.name ?? counterpartyId}
          </span>
        )
      },
    },
    {
      accessorKey: "quantity",
      header: () => <div className="text-right">Quantity</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatTons(row.original.quantity)}t
        </div>
      ),
    },
    {
      id: "occurredAt",
      header: "Date",
      cell: ({ row }) => {
        const transfer = row.original
        return formatTransferDate(
          transfer.occurredAt ?? transfer.createdAt
        )
      },
    },
    {
      id: "documents",
      header: () => <div className="text-right">Documents</div>,
      cell: ({ row }) => {
        const count = row.original.attachments?.length ?? 0
        return (
          <div className="text-right text-muted-foreground">
            {count > 0 ? count : "—"}
          </div>
        )
      },
    },
  ]
}

export const originEvidenceColumns: ColumnDef<OriginEvidenceReference>[] = [
  {
    accessorKey: "name",
    header: "Document",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => {
      const item = row.original
      return item.documentType ?? item.mimeType
    },
  },
  {
    accessorKey: "issuer",
    header: "Issuer",
    cell: ({ row }) => row.original.issuer ?? "—",
  },
  {
    id: "timestamp",
    header: "Timestamp",
    cell: ({ row }) =>
      row.original.timestamp
        ? formatTransferDate(row.original.timestamp)
        : "—",
  },
  {
    accessorKey: "hash",
    header: "Hash",
    cell: ({ row }) => (
      <span className="block max-w-[200px] truncate font-mono text-xs text-muted-foreground">
        {row.original.hash}
      </span>
    ),
  },
]

export const transferEvidenceColumns: ColumnDef<TransferEvidenceRow>[] = [
  {
    accessorKey: "name",
    header: "Document",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => {
      const item = row.original
      return (
        <span className="text-muted-foreground">
          {item.mimeType} · {formatFileSize(item.size)}
        </span>
      )
    },
  },
  {
    accessorKey: "transferId",
    header: "Transfer",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.transferId}</span>
    ),
  },
  {
    accessorKey: "hash",
    header: "Hash",
    cell: ({ row }) => (
      <span className="block max-w-[200px] truncate font-mono text-xs text-muted-foreground">
        {row.original.hash}
      </span>
    ),
  },
]
