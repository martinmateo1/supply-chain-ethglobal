"use client"

import { ArrowLeftRight, History, PackageOpen } from "lucide-react"
import { useState } from "react"

import { AssetRow } from "@/components/asset-row"
import { TransferPanel } from "@/components/transfer-panel"
import { TransferRow } from "@/components/transfer-row"
import { Button } from "@/components/ui/button"
import { ItemGroup } from "@/components/ui/item"
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
import { STAGE_META, type Account } from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

export function TraceabilityView() {
  const companies = useTraceabilityStore((state) => state.companies)
  const selectedCompanyId = useTraceabilityStore((state) => state.selectedCompanyId)
  const selectCompany = useTraceabilityStore((state) => state.selectCompany)
  const accountsByCompany = useTraceabilityStore((state) => state.accountsByCompany)
  const companyTotalTons = useTraceabilityStore((state) => state.companyTotalTons)

  const accounts = useTraceabilityStore((state) => state.accounts)
  const selectedAccountId = useTraceabilityStore((state) => state.selectedAccountId)
  const assetsByAccount = useTraceabilityStore((state) => state.assetsByAccount)
  const accountTotalTons = useTraceabilityStore((state) => state.accountTotalTons)
  const transfersSentByAccount = useTraceabilityStore((state) => state.transfersSentByAccount)
  const transfersReceivedByAccount = useTraceabilityStore((state) => state.transfersReceivedByAccount)

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)
  const companyAccounts = accountsByCompany(selectedCompanyId)

  const [contentView, setContentView] = useState("assets")
  const [transferOpen, setTransferOpen] = useState(false)

  function accountNameById(id: string): string {
    return accounts.find((a) => a.id === id)?.name ?? id
  }

  // Wallets that currently hold assets
  const walletsWithAssets = companyAccounts.filter(
    (a) => assetsByAccount(a.id).length > 0
  )

  // Wallets that have any transfer history
  const walletsWithHistory = companyAccounts.filter(
    (a) =>
      transfersSentByAccount(a.id).length > 0 ||
      transfersReceivedByAccount(a.id).length > 0
  )

  return (
    <div className="h-svh w-full overflow-hidden">
      <div
        className={cn(
          "flex h-full transition-transform duration-[350ms] ease-in-out",
          transferOpen && "-translate-x-[180px]"
        )}
      >
        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="h-svh w-full min-w-0 flex-shrink-0 overflow-y-auto overscroll-y-contain">
          <div className="mx-auto w-full max-w-4xl px-6 py-8 pb-28">

            {/* Header */}
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                {selectedCompany ? (
                  <>
                    <h1 className="text-2xl font-semibold">{selectedCompany.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {STAGE_META[selectedCompany.stageType].label}
                      {selectedCompany.location ? ` · ${selectedCompany.location}` : ""}
                      {" · "}
                      {companyAccounts.length} wallet{companyAccounts.length !== 1 ? "s" : ""}
                      {" · "}
                      {formatTons(companyTotalTons(selectedCompanyId))} t total
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

            {/* Tabs */}
            <Tabs value={contentView} onValueChange={setContentView} className="w-full">
              <TabsList>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* ── Assets tab: one section per wallet ──────────────────────── */}
              <TabsContent value="assets">
                {walletsWithAssets.length === 0 ? (
                  <EmptyState
                    icon={<PackageOpen className="mb-3 size-10 text-muted-foreground/60" />}
                    title="No assets"
                    description="This company currently holds no commodity assets."
                  />
                ) : (
                  <div className="space-y-8 pt-2">
                    {walletsWithAssets.map((account) => {
                      const assets = assetsByAccount(account.id)
                      return (
                        <WalletSection
                          key={account.id}
                          account={account}
                          tons={accountTotalTons(account.id)}
                        >
                          <ItemGroup className="gap-0 overflow-hidden rounded-lg bg-background">
                            {assets.map((asset) => (
                              <AssetRow key={asset.id} asset={asset} />
                            ))}
                          </ItemGroup>
                        </WalletSection>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ── History tab: one section per wallet that has transfers ───── */}
              <TabsContent value="history">
                {walletsWithHistory.length === 0 ? (
                  <EmptyState
                    icon={<History className="mb-3 size-10 text-muted-foreground/60" />}
                    title="No history"
                    description="No transfers have been recorded for this company yet."
                  />
                ) : (
                  <div className="space-y-8 pt-2">
                    {walletsWithHistory.map((account) => {
                      const sent = transfersSentByAccount(account.id)
                      const received = transfersReceivedByAccount(account.id)
                      return (
                        <WalletSection
                          key={account.id}
                          account={account}
                          tons={accountTotalTons(account.id)}
                        >
                          <div className="space-y-4">
                            {sent.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  Sent · {sent.length}
                                </p>
                                <ItemGroup className="gap-0 overflow-hidden rounded-lg bg-background">
                                  {sent.map((transfer) => (
                                    <TransferRow
                                      key={transfer.id}
                                      transfer={transfer}
                                      direction="sent"
                                      counterpartyName={accountNameById(transfer.toAccountId)}
                                    />
                                  ))}
                                </ItemGroup>
                              </div>
                            )}
                            {received.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  Received · {received.length}
                                </p>
                                <ItemGroup className="gap-0 overflow-hidden rounded-lg bg-background">
                                  {received.map((transfer) => (
                                    <TransferRow
                                      key={transfer.id}
                                      transfer={transfer}
                                      direction="received"
                                      counterpartyName={accountNameById(transfer.fromAccountId)}
                                    />
                                  ))}
                                </ItemGroup>
                              </div>
                            )}
                          </div>
                        </WalletSection>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>

          </div>
        </div>

        {/* ── Transfer panel ────────────────────────────────────────────────── */}
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

      {/* Company selector — fixed pill at the bottom */}
      <div className="fixed bottom-6 left-6 z-50">
        <Label htmlFor="company-selector" className="sr-only">
          Company
        </Label>
        <Select value={selectedCompanyId} onValueChange={selectCompany}>
          <SelectTrigger
            id="company-selector"
            size="sm"
            className="rounded-full bg-white shadow-lg dark:bg-background"
          >
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => {
              const StageIcon = STAGE_META[company.stageType].icon
              return (
                <SelectItem key={company.id} value={company.id}>
                  <StageIcon className="size-4 text-muted-foreground" />
                  <span>{company.name}</span>
                  <span className="text-muted-foreground">
                    ({formatTons(companyTotalTons(company.id))} t)
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

// ── Sub-components ────────────────────────────────────────────────────────────

function WalletSection({
  account,
  tons,
  children,
}: {
  account: Account
  tons: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <p className="text-sm font-medium">{account.name}</p>
        {account.location && (
          <span className="text-xs text-muted-foreground">{account.location}</span>
        )}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {formatTons(tons)} t
        </span>
      </div>
      {children}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
      {icon}
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
