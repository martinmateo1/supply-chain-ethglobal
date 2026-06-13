"use client"

import { ArrowLeftRight, Combine, PackagePlus } from "lucide-react"
import { useState } from "react"
import { AssetsPanel } from "@/components/assets-panel"
import { CombinePanel } from "@/components/combine-panel"
import { CreateLotPanel } from "@/components/create-lot-panel"
import { AppNavbar } from "@/components/app-navbar"
import { HistoryPanel } from "@/components/history-panel"
import { RequestsPanel } from "@/components/requests-panel"
import { PrivacyCallout } from "@/components/privacy-callout"
import { TransferPanel } from "@/components/transfer-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { useCustodyGateway } from "@/hooks/use-custody-gateway"
import { useLedgerSync } from "@/hooks/use-ledger-sync"
import {
  partyViewById,
  partyViewLabel,
  partyViewNodeLabel,
  partyViewRoleLabel,
} from "@/lib/demo/party-views"
import { isPrivatePartyView } from "@/lib/provenance"
import { useTraceabilityStore } from "@/lib/store"
import { cn, formatTons } from "@/lib/utils"

type SidePanel = "none" | "transfer" | "create-lot" | "combine"

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
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [requestsSuccess, setRequestsSuccess] = useState<string | null>(null)

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
  const canCombine =
    selectedPartyView?.companyRole === "storage" && Boolean(operationalNodeId)

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
    setRequestsError(null)
    setRequestsSuccess(null)
  }

  async function handleAcceptTransfer(transferId: string) {
    setTransferActionState({ transferId, kind: "accept" })
    setRequestsError(null)
    setRequestsSuccess(null)

    const result = await acceptTransfer(transferId)
    setTransferActionState(null)

    if (result.ok) {
      setRequestsSuccess(
        "Custody transfer accepted. The lot position is now in your holdings."
      )
      return
    }

    setRequestsError(result.error)
  }

  async function handleRejectTransfer(transferId: string) {
    setTransferActionState({ transferId, kind: "reject" })
    setRequestsError(null)
    setRequestsSuccess(null)

    const result = await rejectTransfer(transferId)
    setTransferActionState(null)

    if (result.ok) {
      setRequestsSuccess(
        "Custody transfer rejected. The sender's reserved quantity has been released."
      )
      return
    }

    setRequestsError(result.error)
  }

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden">
      <div
        className={cn(
          "flex min-h-0 flex-1",
          slideClass,
          panelOpen && "-translate-x-[180px]"
        )}
      >
        <div className="h-full w-full min-w-0 flex-shrink-0 overflow-y-auto overscroll-y-contain">
          <AppNavbar
            selectedPartyViewId={selectedPartyViewId}
            onSelectPartyView={handleSelectPartyView}
            isCantonBackend={isCantonBackend}
            isSyncing={isSyncing}
            syncError={syncError}
          />
          <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-28">
            <header className="mb-12 flex flex-wrap items-start justify-between gap-4">
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
                {canCombine ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-full bg-white dark:bg-background",
                      panelOpen && "pointer-events-none opacity-0"
                    )}
                    onClick={() => setSidePanel("combine")}
                  >
                    <Combine />
                    Combine lots
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

            <Tabs
              value={contentView}
              onValueChange={setContentView}
              className="mb-4 w-full gap-6"
            >
              <TabsList>
                <TabsTrigger value="assets">
                  Lot positions
                  <span className="sr-only">
                    — commodity holdings visible to this Party View
                  </span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="gap-1.5">
                  Requests
                  {pendingInbound.length > 0 ? (
                    <span
                      aria-label={`${pendingInbound.length} pending inbound request${pendingInbound.length === 1 ? "" : "s"}`}
                      className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-muted-foreground text-[10px] font-semibold leading-none text-background"
                    >
                      {pendingInbound.length > 9 ? "9+" : pendingInbound.length}
                    </span>
                  ) : null}
                  <span className="sr-only">
                    — pending custody transfers awaiting action
                  </span>
                </TabsTrigger>
                <TabsTrigger value="history">
                  Custody history
                  <span className="sr-only">
                    — completed custody transfers visible to this Party View
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
                <TabsContent value="requests" className="bg-muted">
                  <RequestsPanel
                    pendingInbound={pendingInbound}
                    accountNameById={accountNameById}
                    privacyProof={privacyProof}
                    actionState={transferActionState}
                    error={requestsError}
                    successMessage={requestsSuccess}
                    onAcceptTransfer={(transferId) => {
                      void handleAcceptTransfer(transferId)
                    }}
                    onRejectTransfer={(transferId) => {
                      void handleRejectTransfer(transferId)
                    }}
                  />
                </TabsContent>
                <TabsContent value="history" className="bg-muted">
                  <HistoryPanel
                    sent={visibleSent}
                    received={visibleReceived}
                    pendingOutbound={pendingOutbound}
                    accountNameById={accountNameById}
                    privacyProof={privacyProof}
                  />
                </TabsContent>
              </div>
            </Tabs>

            {selectedPartyView ? (
              <PrivacyCallout partyView={selectedPartyView} />
            ) : null}
          </div>
        </div>

        {canTransfer && operationalNodeId && sidePanel === "transfer" ? (
          <aside
            className={cn(
              "h-full w-[420px] flex-shrink-0 overflow-y-auto overscroll-y-contain border-l border-border bg-background px-6 py-8 pb-28",
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
              "h-full w-[420px] flex-shrink-0 overflow-y-auto overscroll-y-contain border-l border-border bg-background px-6 py-8 pb-28",
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

        {canCombine && operationalNodeId && sidePanel === "combine" ? (
          <aside
            className={cn(
              "h-full w-[420px] flex-shrink-0 overflow-y-auto overscroll-y-contain border-l border-border bg-background px-6 py-8 pb-28",
              panelSlideClass,
              panelOpen && "-translate-x-[240px]"
            )}
            aria-hidden={!panelOpen}
          >
            <CombinePanel
              key={`combine-${operationalNodeId}`}
              onClose={() => setSidePanel("none")}
              accountId={operationalNodeId}
            />
          </aside>
        ) : null}
      </div>
    </div>
  )
}
