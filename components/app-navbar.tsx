"use client"

import { PartyViewSelector } from "@/components/party-view-selector"
import { cn } from "@/lib/utils"

type AppNavbarProps = {
  selectedPartyViewId: string
  onSelectPartyView: (partyViewId: string) => void
  isCantonBackend?: boolean
  isSyncing?: boolean
  syncError?: string | null
  className?: string
}

const CANTON_LEDGER_MESSAGE =
  "Holdings and pending transfers are read from the Canton ledger."

export function AppNavbar({
  selectedPartyViewId,
  onSelectPartyView,
  isCantonBackend = false,
  isSyncing = false,
  syncError = null,
  className,
}: AppNavbarProps) {
  const statusMessage = syncError
    ? syncError
    : isSyncing
      ? "Refreshing holdings from Canton…"
      : CANTON_LEDGER_MESSAGE

  return (
    <header
      className={cn(
        "flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-border/60 px-3 py-3",
        className
      )}
    >
      <PartyViewSelector
        selectedPartyViewId={selectedPartyViewId}
        onSelectPartyView={onSelectPartyView}
        className="mr-auto min-w-0"
      />
      {isCantonBackend ? (
        <p
          className={cn(
            "flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground",
            syncError && "text-destructive"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 rounded-full bg-emerald-500",
              isSyncing && "animate-pulse",
              syncError && "bg-destructive"
            )}
          />
          <span>{statusMessage}</span>
        </p>
      ) : null}
    </header>
  )
}
