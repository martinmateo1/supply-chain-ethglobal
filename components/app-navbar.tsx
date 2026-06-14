"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck, X } from "lucide-react"

import { PartyViewSelector } from "@/components/party-view-selector"
import { Button } from "@/components/ui/button"
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
  const pathname = usePathname()
  const onVerifyPage = pathname === "/verify"

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
        className="min-w-0"
      />
      <div className="ml-auto flex shrink-0 items-center gap-3">
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
        {onVerifyPage ? (
          <Button asChild variant="ghost" size="icon-sm" className="shrink-0">
            <Link href="/" aria-label="Close verifier">
              <X />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/verify">
              <ShieldCheck data-icon="inline-start" />
              Verify attestation
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
