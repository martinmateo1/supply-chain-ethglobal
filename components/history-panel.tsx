"use client"

import { EyeOff, History } from "lucide-react"

import { TransferRow } from "@/components/transfer-row"
import { ItemGroup } from "@/components/ui/item"
import type { Transfer } from "@/lib/types"

type TransferActionState = {
  transferId: string
  kind: "accept" | "reject"
} | null

type HistoryPanelProps = {
  sent: Transfer[]
  received: Transfer[]
  pendingOutbound: Transfer[]
  accountNameById: (id: string) => string
  privacyProof?: boolean
}

export function TransferSection({
  title,
  transfers,
  direction,
  accountNameById,
  showActions = false,
  onAcceptTransfer,
  onRejectTransfer,
  actionState = null,
  emptyMessage,
}: {
  title: string
  transfers: Transfer[]
  direction: "sent" | "received"
  accountNameById: (id: string) => string
  showActions?: boolean
  onAcceptTransfer?: (transferId: string) => void
  onRejectTransfer?: (transferId: string) => void
  actionState?: TransferActionState
  emptyMessage?: string
}) {
  if (transfers.length === 0 && !emptyMessage) {
    return null
  }

  return (
    <div className="space-y-3 rounded-lg bg-muted-foreground/[0.06] p-1 dark:bg-black/20">
      <p className="px-2.5 pt-2 pb-0 text-sm font-medium text-muted-foreground">
        {title}
        {transfers.length > 0
          ? ` · ${transfers.length} transfer${transfers.length === 1 ? "" : "s"}`
          : null}
      </p>
      {transfers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ItemGroup className="gap-0 overflow-hidden rounded-lg bg-background">
          {transfers.map((transfer) => (
            <TransferRow
              key={transfer.id}
              transfer={transfer}
              direction={direction}
              counterpartyName={accountNameById(
                direction === "sent"
                  ? transfer.toAccountId
                  : transfer.fromAccountId
              )}
              showActions={showActions}
              onAccept={onAcceptTransfer}
              onReject={onRejectTransfer}
              actionState={actionState}
            />
          ))}
        </ItemGroup>
      )}
    </div>
  )
}

export function HistoryPanel({
  sent,
  received,
  pendingOutbound,
  accountNameById,
  privacyProof = false,
}: HistoryPanelProps) {
  const hasActivity =
    sent.length > 0 || received.length > 0 || pendingOutbound.length > 0

  if (privacyProof) {
    return (
      <div className="flex flex-col">
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
          <EyeOff className="mb-3 size-10 text-muted-foreground/60" />
          <p className="font-medium">No private transfer history visible</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No private contracts are visible to this company. Custody transfers
            and evidence on the demo route are hidden from unrelated parties by
            Canton selective visibility.
          </p>
        </div>
      </div>
    )
  }

  if (!hasActivity) {
    return (
      <div className="flex flex-col">
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
          <History className="mb-3 size-10 text-muted-foreground/60" />
          <p className="font-medium">No custody history yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Custody transfers visible to this Party View will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-6">
        <TransferSection
          title="Sent — awaiting counterparty"
          transfers={pendingOutbound}
          direction="sent"
          accountNameById={accountNameById}
        />
        <TransferSection
          title="Sent"
          transfers={sent}
          direction="sent"
          accountNameById={accountNameById}
        />
        <TransferSection
          title="Received"
          transfers={received}
          direction="received"
          accountNameById={accountNameById}
        />
      </div>
    </div>
  )
}
