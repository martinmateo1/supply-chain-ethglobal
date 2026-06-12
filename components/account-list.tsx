"use client"

import { ChevronDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { STAGE_META, type Account } from "@/lib/types"
import { useTraceabilityStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type AccountListProps = {
  accounts: Account[]
  selectedAccountId: string
  onSelect: (id: string) => void
}

export function AccountList({
  accounts,
  selectedAccountId,
  onSelect,
}: AccountListProps) {
  const accountTotalTons = useTraceabilityStore(
    (state) => state.accountTotalTons
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-4">
        <h2 className="text-sm font-medium">Supply chain stages</h2>
        <p className="text-xs text-muted-foreground">
          Select a stage to inspect its holdings
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 p-2">
          {accounts.map((account, index) => {
            const stage = STAGE_META[account.stageType]
            const StageIcon = stage.icon
            const totalTons = accountTotalTons(account.id)
            const isSelected = account.id === selectedAccountId

            return (
              <div key={account.id} className="flex flex-col items-center">
                <Button
                  type="button"
                  variant={isSelected ? "secondary" : "ghost"}
                  className={cn(
                    "h-auto w-full justify-start gap-3 px-3 py-3 text-left",
                    isSelected && "ring-1 ring-border"
                  )}
                  onClick={() => onSelect(account.id)}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background">
                    <StageIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{account.name}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {index + 1}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {account.location ?? account.operator ?? stage.label}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {totalTons}
                    </p>
                    <p className="text-[10px] text-muted-foreground">tons</p>
                  </div>
                </Button>
                {index < accounts.length - 1 && (
                  <ChevronDown className="my-0.5 size-4 text-muted-foreground/60" />
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
      <Separator />
      <div className="px-4 py-3 text-xs text-muted-foreground">
        {accounts.length} stages in the commodity flow
      </div>
    </div>
  )
}
