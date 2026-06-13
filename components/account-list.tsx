"use client"

import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { STAGE_META, type Account } from "@/lib/types"
import { useTraceabilityStore } from "@/lib/store"
import { cn, formatTons } from "@/lib/utils"

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
    <div className="flex flex-col">
      <div className="mb-4">
        <h2 className="text-sm font-medium">Accounts</h2>
        <p className="text-xs text-muted-foreground">
          Select an account to inspect its assets
        </p>
      </div>
      <ItemGroup className="gap-2">
        {accounts.map((account) => {
          const stage = STAGE_META[account.stageType]
          const StageIcon = stage.icon
          const totalTons = accountTotalTons(account.id)
          const isSelected = account.id === selectedAccountId

          return (
            <Item
              key={account.id}
              variant={isSelected ? "muted" : "outline"}
              role="listitem"
              className={cn(
                "cursor-pointer flex-nowrap items-center gap-3",
                isSelected && "ring-1 ring-border"
              )}
              onClick={() => onSelect(account.id)}
            >
              <ItemMedia variant="icon" className="self-center">
                <StageIcon className="text-muted-foreground" />
              </ItemMedia>
              <ItemTitle className="min-w-0 flex-1 line-clamp-1">
                {account.name}
              </ItemTitle>
              <span className="shrink-0 text-sm whitespace-nowrap">
                <span className="font-medium tabular-nums">{formatTons(totalTons)}</span>
                <span className="text-muted-foreground"> tons</span>
              </span>
            </Item>
          )
        })}
      </ItemGroup>
      <p className="mt-4 text-xs text-muted-foreground">
        {accounts.length} accounts in the commodity flow
      </p>
    </div>
  )
}
