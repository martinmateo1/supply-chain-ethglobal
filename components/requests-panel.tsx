"use client"

import { Inbox } from "lucide-react"

import { TransferSection } from "@/components/history-panel"
import type { Transfer } from "@/lib/types"

type TransferActionState = {
  transferId: string
  kind: "accept" | "reject"
} | null

type RequestsPanelProps = {
  pendingInbound: Transfer[]
  pendingOutbound: Transfer[]
  accountNameById: (id: string) => string
  privacyProof?: boolean
  onAcceptTransfer?: (transferId: string) => void
  onRejectTransfer?: (transferId: string) => void
  actionState?: TransferActionState
  error?: string | null
  successMessage?: string | null
}

export function RequestsPanel({
  pendingInbound,
  pendingOutbound,
  accountNameById,
  privacyProof = false,
  onAcceptTransfer,
  onRejectTransfer,
  actionState = null,
  error = null,
  successMessage = null,
}: RequestsPanelProps) {
  const pendingCount = pendingInbound.length + pendingOutbound.length

  if (privacyProof) {
    return (
      <div className="flex flex-col">
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
          <Inbox className="mb-3 size-10 text-muted-foreground/60" />
          <p className="font-medium">No private requests visible</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Pending custody transfers are hidden from unrelated parties by Canton
            selective visibility.
          </p>
        </div>
      </div>
    )
  }

  if (pendingCount === 0) {
    return (
      <div className="flex flex-col">
        {error ? (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {successMessage ? (
          <p
            className="mb-4 text-sm text-emerald-800 dark:text-emerald-300"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
          <Inbox className="mb-3 size-10 text-muted-foreground/60" />
          <p className="font-medium">No pending requests</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Inbound transfers awaiting your decision and outbound transfers
            awaiting counterparty acceptance will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-6">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {successMessage ? (
          <p
            className="text-sm text-emerald-800 dark:text-emerald-300"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}
        <TransferSection
          title="Awaiting your acceptance"
          transfers={pendingInbound}
          direction="received"
          accountNameById={accountNameById}
          showActions
          onAcceptTransfer={onAcceptTransfer}
          onRejectTransfer={onRejectTransfer}
          actionState={actionState}
        />
        <TransferSection
          title="Sent — awaiting counterparty"
          transfers={pendingOutbound}
          direction="sent"
          accountNameById={accountNameById}
        />
      </div>
    </div>
  )
}
