"use client"

import { ArrowLeftRight } from "lucide-react"
import { useState } from "react"

import { AssetsPanel } from "@/components/assets-panel"
import { HistoryPanel } from "@/components/history-panel"
import { TransferPanel } from "@/components/transfer-panel"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTraceabilityStore } from "@/lib/store"
import { STAGE_META } from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

export function TraceabilityView() {
  const accounts = useTraceabilityStore((state) => state.accounts)
  const selectedAccountId = useTraceabilityStore(
    (state) => state.selectedAccountId
  )
  const selectAccount = useTraceabilityStore((state) => state.selectAccount)
  const assetsByAccount = useTraceabilityStore((state) => state.assetsByAccount)
  const accountTotalTons = useTraceabilityStore(
    (state) => state.accountTotalTons
  )
  const transfersSentByAccount = useTraceabilityStore(
    (state) => state.transfersSentByAccount
  )
  const transfersReceivedByAccount = useTraceabilityStore(
    (state) => state.transfersReceivedByAccount
  )
  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId
  )
  const [contentView, setContentView] = useState("assets")
  const [transferOpen, setTransferOpen] = useState(false)

  function accountNameById(id: string): string {
    return accounts.find((account) => account.id === id)?.name ?? id
  }

  return (
    // Outer viewport: fixed height so each panel scrolls independently
    <div className="h-svh w-full overflow-hidden">
      {/*
        The row holds both panels side by side.
        Sliding it left by 420px reveals the transfer panel that was
        already sitting to the right — nothing animates "in", it's just uncovered.
      */}
      <div
        className={cn(
          "flex h-full transition-transform duration-[350ms] ease-in-out",
          transferOpen && "-translate-x-[180px]"
        )}
      >
        {/* ── Main content ───────────────────────────── */}
        <div className="h-svh w-full min-w-0 flex-shrink-0 overflow-y-auto overscroll-y-contain">
          <div className="mx-auto w-full max-w-4xl px-6 py-8 pb-28">
            <Tabs
              value={selectedAccountId}
              onValueChange={selectAccount}
              className="@container/main w-full"
            >
              <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  {selectedAccount ? (
                    <>
                      <h1 className="text-2xl font-semibold">
                        Welcome {selectedAccount.name} user,
                      </h1>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Viewing coffee and cacao custody across the demo route.
                      </p>
                    </>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "shrink-0 rounded-full bg-white transition-opacity duration-300 dark:bg-background",
                    transferOpen && "pointer-events-none opacity-0"
                  )}
                  onClick={() => setTransferOpen(true)}
                >
                  <ArrowLeftRight />
                  Transfer Assets
                </Button>
              </header>

              <Tabs
                value={contentView}
                onValueChange={setContentView}
                className="mb-4 w-full"
              >
                <TabsList variant="line">
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="overflow-hidden rounded-lg bg-muted">
                {accounts.map((account) => {
                  const assets = assetsByAccount(account.id)
                  return (
                    <TabsContent
                      key={account.id}
                      value={account.id}
                      className="bg-muted"
                    >
                      {contentView === "assets" ? (
                        <AssetsPanel account={account} assets={assets} />
                      ) : (
                        <HistoryPanel
                          account={account}
                          sent={transfersSentByAccount(account.id)}
                          received={transfersReceivedByAccount(account.id)}
                          accountNameById={accountNameById}
                        />
                      )}
                    </TabsContent>
                  )
                })}
              </div>
            </Tabs>
          </div>
        </div>

        {/* ── Transfer panel — always in the DOM, to the right ── */}
        <aside
          className={cn(
            "h-svh w-[420px] flex-shrink-0 overflow-y-auto overscroll-y-contain border-l border-border bg-background px-6 py-8 pb-28 transition-transform duration-[600ms] delay-[60ms] ease-out",
            transferOpen && "-translate-x-[240px]"
          )}
          aria-hidden={!transferOpen}
        >
          <TransferPanel
            key={selectedAccountId}
            onClose={() => setTransferOpen(false)}
            fromAccountId={selectedAccountId}
          />
        </aside>
      </div>

      {/* Account selector — fixed so it stays put during the slide */}
      <div className="fixed bottom-6 left-6 z-50">
        <Label htmlFor="account-selector" className="sr-only">
          Account
        </Label>
        <Select value={selectedAccountId} onValueChange={selectAccount}>
          <SelectTrigger
            id="account-selector"
            size="sm"
            className="rounded-full bg-white shadow-lg dark:bg-background"
          >
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => {
              const StageIcon = STAGE_META[account.stageType].icon
              return (
                <SelectItem key={account.id} value={account.id}>
                  <StageIcon className="size-4 text-muted-foreground" />
                  <span>{account.name}</span>
                  <span className="text-muted-foreground">
                    ({formatTons(accountTotalTons(account.id))}t)
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
