"use client"

import Link from "next/link"
import { useMemo, type ReactNode } from "react"
import { EyeOff, FileQuestion } from "lucide-react"

import {
  createCustodyActivityColumns,
  originEvidenceColumns,
  transferEvidenceColumns,
} from "@/components/asset-detail/columns"
import { AppNavbar } from "@/components/app-navbar"
import { AttestationPanel } from "@/components/attestation-panel"
import { CommodityThumbnail } from "@/components/commodity-thumbnail"
import { ProvenanceTimeline } from "@/components/provenance-timeline"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Separator } from "@/components/ui/separator"
import {
  isPrivatePartyView,
  originFingerprint,
  tokenId,
  transferMatchesAsset,
} from "@/lib/provenance"
import { buildProvenanceTimeline } from "@/lib/demo/custody-service"
import { partyViewById, partyViewLabel } from "@/lib/demo/party-views"
import { useTraceabilityStore } from "@/lib/store"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  RATING_META,
  STAGE_META,
  type Transfer,
} from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type AssetDetailViewProps = {
  assetId: string
}

function transfersVisibleToParty(
  transfers: Transfer[],
  partyId: string,
  assetAccountId: string
): Transfer[] {
  // Current custodian sees the full batch custody chain (demo product decision).
  if (assetAccountId === partyId) return transfers

  return transfers.filter(
    (transfer) =>
      transfer.fromAccountId === partyId || transfer.toAccountId === partyId
  )
}

export function AssetDetailView({ assetId }: AssetDetailViewProps) {
  const assets = useTraceabilityStore((state) => state.assets)
  const transfers = useTraceabilityStore((state) => state.transfers)
  const accounts = useTraceabilityStore((state) => state.accounts)
  const selectedPartyViewId = useTraceabilityStore(
    (state) => state.selectedPartyViewId
  )
  const selectPartyView = useTraceabilityStore((state) => state.selectPartyView)
  const isAssetVisibleToSelectedParty = useTraceabilityStore(
    (state) => state.isAssetVisibleToSelectedParty
  )

  const asset = useMemo(
    () => assets.find((item) => item.id === assetId),
    [assets, assetId]
  )
  const selectedPartyView = useMemo(
    () => partyViewById(selectedPartyViewId),
    [selectedPartyViewId]
  )
  const visibilityPartyId = selectedPartyView?.operationalNodeId ?? selectedPartyViewId
  const relatedTransfers = useMemo(() => {
    if (!asset) return []

    return transfers
      .filter((transfer) => transferMatchesAsset(transfer, asset))
          .sort(
            (a, b) =>
              new Date(b.occurredAt ?? b.createdAt).getTime() -
              new Date(a.occurredAt ?? a.createdAt).getTime()
          )
  }, [asset, transfers])
  const isVisible = useMemo(() => {
    if (!asset) return false
    return isAssetVisibleToSelectedParty(assetId)
  }, [asset, assetId, isAssetVisibleToSelectedParty])

  const accountById = useMemo(
    () => (id: string) => accounts.find((account) => account.id === id),
    [accounts]
  )
  const partyTransfers = useMemo(() => {
    if (!asset) return []
    return transfersVisibleToParty(
      relatedTransfers,
      visibilityPartyId,
      asset.accountId
    )
  }, [asset, relatedTransfers, visibilityPartyId])
  const evidence = useMemo(
    () =>
      partyTransfers.flatMap((transfer) =>
        (transfer.attachments ?? []).map((attachment) => ({
          ...attachment,
          transferId: transfer.id,
        }))
      ),
    [partyTransfers]
  )
  const custodyActivityColumns = useMemo(
    () =>
      createCustodyActivityColumns({
        accountById,
        visibilityPartyId,
        assetAccountId: asset?.accountId ?? "",
      }),
    [accountById, visibilityPartyId, asset?.accountId]
  )
  const provenanceTimeline = useMemo(() => {
    if (!asset) return []
    // Visibility-scoped: pass only the transfers this party may see so the
    // timeline never exposes another party's private custody steps (AC5).
    return buildProvenanceTimeline(asset, { assets, transfers }, partyTransfers)
  }, [asset, assets, transfers, partyTransfers])

  const pageShell = (content: ReactNode) => (
    <div className="flex h-svh w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <AppNavbar
          selectedPartyViewId={selectedPartyViewId}
          onSelectPartyView={selectPartyView}
        />
        {content}
      </div>
    </div>
  )

  if (!asset) {
    return pageShell(
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <FileQuestion className="size-12 text-muted-foreground/60" />
        <div>
          <h1 className="text-xl font-semibold">Asset not found</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            No lot position exists for ID{" "}
            <span className="font-mono">{assetId}</span>.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  if (!isVisible) {
    const partyName = selectedPartyView
      ? partyViewLabel(selectedPartyView)
      : "This company"

    return pageShell(
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <EyeOff className="size-12 text-muted-foreground/60" />
        <div>
          <h1 className="text-xl font-semibold">Not visible to this party</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            No private contracts are visible to {partyName}. Canton visibility
            is limited to involved custodians and transfer counterparties —
            unrelated parties cannot inspect lot positions, custody transfers, or
            evidence on this route.
          </p>
          {isPrivatePartyView(selectedPartyViewId) ? (
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              This blocked view is expected selective visibility behavior, not a
              missing-data error or broken demo.
            </p>
          ) : null}
        </div>
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  const holdingAccount = accountById(asset.accountId)
  const commodity = COMMODITY_META[asset.commodity]
  const rating = RATING_META[asset.rating]
  const StageIcon = holdingAccount
    ? STAGE_META[holdingAccount.stageType].icon
    : null
  const originEvidence = asset.originEvidence ?? []
  const fingerprint = originFingerprint(asset)

  return pageShell(
    <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-28">
      <div className="mb-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{commodity.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <header className="mb-12 flex gap-4">
        <CommodityThumbnail
          commodity={asset.commodity}
          certifications={asset.certifications}
          size={64}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {tokenId(asset.id)}
          </p>
          <h1 className="text-2xl font-semibold">{commodity.label}</h1>
        </div>
      </header>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Lot position
        </h2>
        <div className="rounded-lg border bg-background p-4 text-sm">
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium tabular-nums">
              {formatTons(asset.quantity)} {asset.unit}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Grade</span>
            <Badge
              className={cn("rounded-md border-none", rating.className)}
            >
              Grade {rating.label}
            </Badge>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Certifications</span>
            {asset.certifications.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-1.5">
                {asset.certifications.map((cert) => (
                  <Badge
                    key={cert}
                    variant="outline"
                    className={CERTIFICATION_META[cert].className}
                  >
                    {CERTIFICATION_META[cert].label}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Standard batch</span>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Current custody
        </h2>
        <div className="rounded-lg border bg-background p-4 text-sm">
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Operational node</span>
            <span className="flex items-center gap-1.5 font-medium">
              {StageIcon ? (
                <StageIcon className="size-3.5 text-muted-foreground" />
              ) : null}
              {holdingAccount?.name ?? asset.accountId}
            </span>
          </div>
          <Separator className="my-2" />
          {holdingAccount?.location ? (
            <>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-muted-foreground">Location</span>
                <span>{holdingAccount.location}</span>
              </div>
              <Separator className="my-2" />
            </>
          ) : null}
          {holdingAccount?.operator ? (
            <>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-muted-foreground">Operator</span>
                <span>{holdingAccount.operator}</span>
              </div>
              <Separator className="my-2" />
            </>
          ) : null}
          {asset.originIdentifier ? (
            <>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-muted-foreground">Origin identifier</span>
                <span className="max-w-[55%] truncate font-mono text-xs">
                  {asset.originIdentifier}
                </span>
              </div>
              <Separator className="my-2" />
            </>
          ) : null}
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Origin fingerprint</span>
            <span className="font-mono text-xs">{fingerprint}</span>
          </div>
        </div>
      </section>

      {asset.sourceLotIds && asset.sourceLotIds.length > 0 ? (
        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Source lot positions
          </h2>
          <div className="rounded-lg border bg-background p-4 text-sm">
            <p className="mb-3 text-xs text-muted-foreground">
              This lot was derived from a split or combine. Provenance links to
              every source position below are preserved; certifications and
              evidence are carried forward.
            </p>
            {asset.sourceLotIds.map((sourceId, index) => {
              const sourceVisible = isAssetVisibleToSelectedParty(sourceId)
              return (
                <div key={sourceId}>
                  {index > 0 ? <Separator className="my-2" /> : null}
                  <div className="flex items-center justify-between gap-3 py-1.5">
                    <span className="text-muted-foreground">
                      Source reference
                    </span>
                    {sourceVisible ? (
                      <Link
                        href={`/asset/${sourceId}`}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {tokenId(sourceId)}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs">
                        {tokenId(sourceId)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Provenance timeline
        </h2>
        <p className="text-xs text-muted-foreground">
          Read-only projection of this lot&apos;s origin, splits, combines, and
          custody transfers. Each step shows the operation, parties, quantity,
          and conservation result. Evidence stays bound to the step it supports.
        </p>
        <ProvenanceTimeline
          entries={provenanceTimeline}
          accountName={(id) => accountById(id)?.name ?? id}
          isSourceVisible={isAssetVisibleToSelectedParty}
        />
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Custody activity
        </h2>
        {partyTransfers.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No custody transfers visible to{" "}
            {selectedPartyView ? partyViewLabel(selectedPartyView) : "this party"}{" "}
            for this lot yet.
          </div>
        ) : (
          <DataTable
            columns={custodyActivityColumns}
            data={partyTransfers}
          />
        )}
      </section>

      {originEvidence.length > 0 ? (
        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Origin evidence references
          </h2>
          <DataTable
            columns={originEvidenceColumns}
            data={originEvidence}
          />
        </section>
      ) : null}

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Transfer evidence references
        </h2>
        {evidence.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No document hashes are bound to visible transfers for this lot.
          </div>
        ) : (
          <DataTable
            columns={transferEvidenceColumns}
            data={evidence}
          />
        )}
      </section>

      <AttestationPanel asset={asset} />
    </div>
  )
}
