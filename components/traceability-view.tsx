"use client"

import { ArrowLeftRight, ChevronRight } from "lucide-react"
import { Fragment, useState } from "react"

import { AssetsPanel } from "@/components/assets-panel"
import { HistoryPanel } from "@/components/history-panel"
import { TransferModal } from "@/components/transfer-modal"
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
import { formatTons } from "@/lib/utils"

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
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  function accountNameById(id: string): string {
    return accounts.find((account) => account.id === id)?.name ?? id
  }

  return (
    <div className="mx-auto min-h-svh w-full max-w-4xl px-6 py-8 pb-28">
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
                  Welcome {STAGE_META[selectedAccount.stageType].label} user,
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Here&apos;s an overview of your account.
                </p>
              </>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full bg-white dark:bg-background"
            onClick={() => setTransferModalOpen(true)}
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

        <div className="fixed bottom-6 left-6 z-50 rounded-full border border-border bg-background p-1.5 shadow-lg">
          <Label htmlFor="account-selector" className="sr-only">
            Account
          </Label>
          <Select value={selectedAccountId} onValueChange={selectAccount}>
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="account-selector"
            >
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({formatTons(accountTotalTons(account.id))}t)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TabsList className="hidden gap-1 bg-transparent @4xl/main:flex">
            {accounts.map((account, index) => (
              <Fragment key={account.id}>
                {index > 0 ? (
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
                <TabsTrigger value={account.id} className="flex-none">
                  {account.name}
                </TabsTrigger>
              </Fragment>
            ))}
          </TabsList>
        </div>

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

      <TransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        defaultFromAccountId={selectedAccountId}
      />
    </div>
  )
}
