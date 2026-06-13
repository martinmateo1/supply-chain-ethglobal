"use client"

import { ArrowLeftRight, PackagePlus } from "lucide-react"
import { useState } from "react"
import { AssetsPanel } from "@/components/assets-panel"
import { CreateLotPanel } from "@/components/create-lot-panel"
import { DemoStepper } from "@/components/demo-stepper"
import { HistoryPanel } from "@/components/history-panel"
import { PrivacyCallout } from "@/components/privacy-callout"
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
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { useCustodyGateway } from "@/hooks/use-custody-gateway"
import { useLedgerSync } from "@/hooks/use-ledger-sync"
import {
  DEMO_PARTY_VIEWS,
  isRoutePartyView,
  partyViewById,
  partyViewLabel,
  partyViewNodeLabel,
  partyViewRoleLabel,
} from "@/lib/demo/party-views"
import { isPrivatePartyView } from "@/lib/provenance"
import { useTraceabilityStore } from "@/lib/store"
import { STAGE_META } from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type SidePanel = "none" | "transfer" | "create-lot"

export function TraceabilityView() {
  const accounts = useTraceabilityStore((state) => state.accounts)
  const selectedPartyViewId = useTraceabilityStore(
    (state) => state.selectedPartyViewId
  )
  const selectPartyView = useTraceabilityStore((state) => state.selectPartyView)
  const visibleAssetsForPartyView = useTraceabilityStore(
    (state) => state.visibleAssetsForPartyView
  )
  const partyViewVisibleTotalTons = useTraceabilityStore(
    (state) => state.partyViewVisibleTotalTons
  )
  const visibleTransfersSentForPartyView = useTraceabilityStore(
    (state) => state.visibleTransfersSentForPartyView
  )
  const visibleTransfersReceivedForPartyView = useTraceabilityStore(
    (state) => state.visibleTransfersReceivedForPartyView
  )
  const visiblePendingInboundForPartyView = useTraceabilityStore(
    (state) => state.visiblePendingInboundForPartyView
  )
  const visiblePendingOutboundForPartyView = useTraceabilityStore(
    (state) => state.visiblePendingOutboundForPartyView
  )

  const { acceptTransfer, rejectTransfer } = useCustodyGateway()
  const { isCantonBackend, isSyncing, syncError } = useLedgerSync()

  const [transferActionState, setTransferActionState] = useState<{
    transferId: string
    kind: "accept" | "reject"
  } | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historySuccess, setHistorySuccess] = useState<string | null>(null)

  const selectedPartyView = partyViewById(selectedPartyViewId)
  const privacyProof = isPrivatePartyView(selectedPartyViewId)
  const visibleAssets = visibleAssetsForPartyView(selectedPartyViewId)
  const visibleSent = visibleTransfersSentForPartyView(selectedPartyViewId)
  const visibleReceived = visibleTransfersReceivedForPartyView(
    selectedPartyViewId
  )
  const pendingInbound = visiblePendingInboundForPartyView(selectedPartyViewId)
  const pendingOutbound = visiblePendingOutboundForPartyView(selectedPartyViewId)
  const visibleTotalTons = partyViewVisibleTotalTons(selectedPartyViewId)
  const operationalNodeId = selectedPartyView?.operationalNodeId ?? null
  const canTransfer = Boolean(operationalNodeId) && !privacyProof
  const canCreateLot =
    selectedPartyView?.companyRole === "producer" &&
    operationalNodeId === "production-site"

  const prefersReducedMotion = usePrefersReducedMotion()
  const slideClass = prefersReducedMotion
    ? ""
    : "transition-transform duration-[350ms] ease-in-out"
  const panelSlideClass = prefersReducedMotion
    ? ""
    : "transition-transform duration-[600ms] delay-[60ms] ease-out"

  const [contentView, setContentView] = useState("assets")
  const [sidePanel, setSidePanel] = useState<SidePanel>("none")
  const panelOpen = sidePanel !== "none"

  function accountNameById(id: string): string {
    return accounts.find((account) => account.id === id)?.name ?? id
  }

  function handleSelectPartyView(id: string) {
    selectPartyView(id)
    setSidePanel("none")
    setHistoryError(null)
    setHistorySuccess(null)
  }

  async function handleAcceptTransfer(transferId: string) {
    setTransferActionState({ transferId, kind: "accept" })
    setHistoryError(null)
    setHistorySuccess(null)

    const result = await acceptTransfer(transferId)
    setTransferActionState(null)

    if (result.ok) {
      setHistorySuccess(
        "Custody transfer accepted. The lot position is now in your holdings."
      )
      return
    }

    setHistoryError(result.error)
  }

  async function handleRejectTransfer(transferId: string) {
    setTransferActionState({ transferId, kind: "reject" })
    setHistoryError(null)
    setHistorySuccess(null)

    const result = await rejectTransfer(transferId)
    setTransferActionState(null)

    if (result.ok) {
      setHistorySuccess(
        "Custody transfer rejected. The sender's reserved quantity has been released."
      )
      return
    }

    setHistoryError(result.error)
  }

  return (
    <div className="h-svh w-full overflow-hidden">
      <div
        className={cn(
          "flex h-full",
          slideClass,
          panelOpen && "-translate-x-[180px]"
        )}
      >
        <div className="h-svh w-full min-w-0 flex-shrink-0 overflow-y-auto overscroll-y-contain">
          <div className="mx-auto w-full max-w-4xl px-6 py-8 pb-28">
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                {selectedPartyView ? (
                  <>
                    <h1 className="text-2xl font-semibold">
                      {partyViewLabel(selectedPartyView)}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {partyViewRoleLabel(selectedPartyView)}
                      {partyViewNodeLabel(selectedPartyView)
                        ? ` · ${partyViewNodeLabel(selectedPartyView)}`
                        : privacyProof
                          ? " · Unrelated to the demo custody route"
                          : null}
                      {" · "}
                      {formatTons(visibleTotalTons)}t visible
                    </p>
                  </>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {canCreateLot ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-full bg-white dark:bg-background",
                      panelOpen && "pointer-events-none opacity-0"
                    )}
                    onClick={() => setSidePanel("create-lot")}
                  >
                    <PackagePlus />
                    Create Lot
                  </Button>
                ) : null}
                {canTransfer ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-full bg-white dark:bg-background",
                      panelOpen && "pointer-events-none opacity-0"
                    )}
                    onClick={() => setSidePanel("transfer")}
                  >
                    <ArrowLeftRight />
                    Transfer custody
                  </Button>
                ) : null}
              </div>
            </header>

            <DemoStepper
              selectedPartyViewId={selectedPartyViewId}
              onSelectPartyView={handleSelectPartyView}
            />

            {isCantonBackend ? (
              <p className="text-muted-foreground mb-4 text-sm">
                {isSyncing
                  ? "Refreshing holdings from Canton…"
                  : "Holdings and pending transfers are read from the Canton ledger."}
                {syncError ? ` ${syncError}` : null}
              </p>
            ) : null}

            {selectedPartyView ? (
              <PrivacyCallout partyView={selectedPartyView} />
            ) : null}

            <Tabs
              value={contentView}
              onValueChange={setContentView}
              className="mb-4 w-full"
            >
              <TabsList variant="line">
                <TabsTrigger value="assets">
                  Lot positions
                  <span className="sr-only">
                    — commodity holdings visible to this Party View
                  </span>
                </TabsTrigger>
                <TabsTrigger value="history">
                  Custody history
                  <span className="sr-only">
                    — custody transfers visible to this Party View
                  </span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 overflow-hidden rounded-lg bg-muted">
                <TabsContent value="assets" className="bg-muted">
                  <AssetsPanel
                    assets={visibleAssets}
                    accounts={accounts}
                    privacyProof={privacyProof}
                  />
                </TabsContent>
                <TabsContent value="history" className="bg-muted">
                  <HistoryPanel
                    sent={visibleSent}
                    received={visibleReceived}
                    pendingInbound={pendingInbound}
                    pendingOutbound={pendingOutbound}
                    accountNameById={accountNameById}
                    privacyProof={privacyProof}
                    actionState={transferActionState}
                    error={historyError}
                    successMessage={historySuccess}
                    onAcceptTransfer={(transferId) => {
                      void handleAcceptTransfer(transferId)
                    }}
                    onRejectTransfer={(transferId) => {
                      void handleRejectTransfer(transferId)
                    }}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {canTransfer && operationalNodeId && sidePanel === "transfer" ? (
          <aside
            className={cn(
              "h-svh w-[420px] flex-shrink-0 overflow-y-auto overscroll-y-contain border-l border-border bg-background px-6 py-8 pb-28",
              panelSlideClass,
              panelOpen && "-translate-x-[240px]"
            )}
            aria-hidden={!panelOpen}
          >
            <TransferPanel
              key={operationalNodeId}
              onClose={() => setSidePanel("none")}
              fromAccountId={operationalNodeId}
            />
          </aside>
        ) : null}

        {canCreateLot && operationalNodeId && sidePanel === "create-lot" ? (
          <aside
            className={cn(
              "h-svh w-[420px] flex-shrink-0 overflow-y-auto overscroll-y-contain border-l border-border bg-background px-6 py-8 pb-28",
              panelSlideClass,
              panelOpen && "-translate-x-[240px]"
            )}
            aria-hidden={!panelOpen}
          >
            <CreateLotPanel
              key={`create-${operationalNodeId}`}
              onClose={() => setSidePanel("none")}
              operationalNodeId={operationalNodeId}
            />
          </aside>
        ) : null}
      </div>

      <div className="fixed bottom-6 left-6 z-50">
        <Label htmlFor="party-view-selector" className="sr-only">
          Party View
        </Label>
        <Select value={selectedPartyViewId} onValueChange={handleSelectPartyView}>
          <SelectTrigger
            id="party-view-selector"
            size="sm"
            className="max-w-[min(100vw-3rem,28rem)] rounded-full bg-white shadow-lg dark:bg-background"
          >
            {selectedPartyView ? (
              <span className="truncate text-left text-sm">
                <span className="font-medium">
                  {partyViewLabel(selectedPartyView)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {partyViewRoleLabel(selectedPartyView)}
                  {partyViewNodeLabel(selectedPartyView)
                    ? ` · ${partyViewNodeLabel(selectedPartyView)}`
                    : ""}
                  {" "}
                  · {formatTons(visibleTotalTons)}t
                </span>
              </span>
            ) : (
              <SelectValue placeholder="Select a Party View" />
            )}
          </SelectTrigger>
          <SelectContent>
            {DEMO_PARTY_VIEWS.map((view) => {
              const totalTons = partyViewVisibleTotalTons(view.id)
              const nodeLabel = partyViewNodeLabel(view)
              const roleLabel = partyViewRoleLabel(view)
              const StageIcon = view.operationalNodeId
                ? STAGE_META[
                    accounts.find((a) => a.id === view.operationalNodeId)
                      ?.stageType ?? "production"
                  ].icon
                : null

              return (
                <SelectItem key={view.id} value={view.id}>
                  {StageIcon ? (
                    <StageIcon className="size-4 text-muted-foreground" />
                  ) : null}
                  <span className="min-w-0 truncate">
                    {partyViewLabel(view)}
                  </span>
                  <span className="text-muted-foreground">
                    {isRoutePartyView(view)
                      ? `(${formatTons(totalTons)}t)`
                      : view.companyRole === "non-involved"
                        ? "(unrelated)"
                        : `(${formatTons(totalTons)}t)`}
                  </span>
                  <span className="sr-only">
                    {roleLabel}
                    {nodeLabel ? ` · ${nodeLabel}` : ""}
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
