import { EyeOff, History } from "lucide-react"

import { TransferRow } from "@/components/transfer-row"
import { ItemGroup } from "@/components/ui/item"
import type { Transfer } from "@/lib/types"

type HistoryPanelProps = {
  sent: Transfer[]
  received: Transfer[]
  accountNameById: (id: string) => string
  privacyProof?: boolean
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
  sent,
  received,
  accountNameById,
  privacyProof = false,
}: HistoryPanelProps) {
  const hasHistory = sent.length > 0 || received.length > 0

  return (
    <div className="flex flex-col">
      {!hasHistory ? (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
          {privacyProof ? (
            <>
              <EyeOff className="mb-3 size-10 text-muted-foreground/60" />
              <p className="font-medium">No private transfer history visible</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                No private contracts are visible to this company. Custody
                transfers and evidence on the demo route are hidden from
                unrelated parties by Canton selective visibility.
              </p>
            </>
          ) : (
            <>
              <History className="mb-3 size-10 text-muted-foreground/60" />
              <p className="font-medium">No custody history yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Custody transfers visible to this Party View will appear here.
              </p>
            </>
          )}
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
