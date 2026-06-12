"use client"

import { useEffect, useState } from "react"

import { AccountList } from "@/components/account-list"
import { HoldingsPanel } from "@/components/holdings-panel"
import { Separator } from "@/components/ui/separator"
import { useTraceabilityStore } from "@/lib/store"

export function TraceabilityView() {
  const [hydrated, setHydrated] = useState(
    () => useTraceabilityStore.persist.hasHydrated()
  )
  const accounts = useTraceabilityStore((state) => state.accounts)
  const selectedAccountId = useTraceabilityStore(
    (state) => state.selectedAccountId
  )
  const selectAccount = useTraceabilityStore((state) => state.selectAccount)
  const holdingsByAccount = useTraceabilityStore(
    (state) => state.holdingsByAccount
  )
  const accountTotalTons = useTraceabilityStore(
    (state) => state.accountTotalTons
  )

  useEffect(() => {
    if (hydrated) {
      return
    }

    return useTraceabilityStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
  }, [hydrated])

  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId
  )
  const holdings = hydrated ? holdingsByAccount(selectedAccountId) : []
  const totalTons = hydrated ? accountTotalTons(selectedAccountId) : 0

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Trazabilidad de Commodities
            </h1>
            <p className="text-sm text-muted-foreground">
              Trace commodity holdings across supply chain stages
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Press <kbd className="rounded border px-1">d</kbd> to toggle theme
          </p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-0 border-b lg:border-r lg:border-b-0">
          <AccountList
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelect={selectAccount}
          />
        </aside>
        <Separator className="lg:hidden" />
        <section className="min-h-0 lg:min-h-0">
          <HoldingsPanel
            account={selectedAccount}
            holdings={holdings}
            totalTons={totalTons}
          />
        </section>
      </div>
    </div>
  )
}
