import { PackageOpen } from "lucide-react"

import { HoldingCard } from "@/components/holding-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { STAGE_META, type Account, type Holding } from "@/lib/types"

type HoldingsPanelProps = {
  account: Account | undefined
  holdings: Holding[]
  totalTons: number
}

export function HoldingsPanel({
  account,
  holdings,
  totalTons,
}: HoldingsPanelProps) {
  if (!account) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Select a stage to view its assets
      </div>
    )
  }

  const stage = STAGE_META[account.stageType]
  const StageIcon = stage.icon

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <StageIcon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{account.name}</h2>
                <Badge variant="outline">{stage.label}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {account.location ?? account.operator ?? "Supply chain stage"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums">{totalTons}</p>
            <p className="text-xs text-muted-foreground">total tons</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {holdings.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
            <PackageOpen className="mb-3 size-10 text-muted-foreground/60" />
            <p className="font-medium">No assets in this stage</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              This account has no commodity holdings yet. Transfers between
              stages will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {holdings.length} holding{holdings.length === 1 ? "" : "s"}
              </p>
              <Separator className="ml-4 flex-1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {holdings.map((holding) => (
                <HoldingCard key={holding.id} holding={holding} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
