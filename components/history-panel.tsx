import { History } from "lucide-react"

import { TransferRow } from "@/components/transfer-row"
import { ItemGroup } from "@/components/ui/item"
import type { Account, Transfer } from "@/lib/types"

type HistoryPanelProps = {
  account: Account | undefined
  sent: Transfer[]
  received: Transfer[]
  accountNameById: (id: string) => string
}

function TransferSection({
  title,
  transfers,
  direction,
  accountNameById,
}: {
  title: string
  transfers: Transfer[]
  direction: "sent" | "received"
  accountNameById: (id: string) => string
}) {
  if (transfers.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        {title} &middot; {transfers.length} transfer
        {transfers.length === 1 ? "" : "s"}
      </p>
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
          />
        ))}
      </ItemGroup>
    </div>
  )
}

export function HistoryPanel({
  account,
  sent,
  received,
  accountNameById,
}: HistoryPanelProps) {
  if (!account) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Select an account to view its history
      </div>
    )
  }

  const hasHistory = sent.length > 0 || received.length > 0

  return (
    <div className="flex flex-col">
      {!hasHistory ? (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
          <History className="mb-3 size-10 text-muted-foreground/60" />
          <p className="font-medium">No history yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Asset transfers and activity for this account will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
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
      )}
    </div>
  )
}
