"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  EyeOff,
  FileQuestion,
  ShieldCheck,
} from "lucide-react"

import { CommodityThumbnail } from "@/components/commodity-thumbnail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  isPrivatePartyView,
  originFingerprint,
  tokenId,
  transferMatchesAsset,
} from "@/lib/provenance"
import { partyViewById, partyViewLabel } from "@/lib/demo/party-views"
import { useTraceabilityStore } from "@/lib/store"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  RATING_META,
  STAGE_META,
  type OriginEvidenceReference,
  type Transfer,
} from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type AssetDetailViewProps = {
  assetId: string
}

function formatTransferDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate))
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

  if (!asset) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
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

    return (
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
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
  const partyTransfers = transfersVisibleToParty(
    relatedTransfers,
    visibilityPartyId,
    asset.accountId
  )
  const evidence = partyTransfers.flatMap((transfer) =>
    (transfer.attachments ?? []).map((attachment) => ({
      ...attachment,
      transferId: transfer.id,
    }))
  )
  const originEvidence = asset.originEvidence ?? []
  const fingerprint = originFingerprint(asset)

  return (
    <div className="mx-auto min-h-svh w-full max-w-3xl px-6 py-8 pb-28">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-6 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium">
          Party view: {selectedPartyView ? partyViewLabel(selectedPartyView) : visibilityPartyId}
        </p>
        <p className="mt-1 text-muted-foreground">
          {asset.accountId === visibilityPartyId
            ? "You can see this lot because it is held at your operational node."
            : "You can see this lot because your party participated in a related custody transfer."}
        </p>
      </div>

      <header className="mb-8 flex gap-4">
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
          <p className="mt-1 text-sm text-muted-foreground">
            {formatTons(asset.quantity)} {asset.unit} · Grade {rating.label}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              className={cn(
                "rounded-md border-none",
                rating.className
              )}
            >
              Grade {rating.label}
            </Badge>
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
        </div>
      </header>

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
          <div className="overflow-hidden rounded-lg border bg-background">
            {partyTransfers.map((transfer) => {
              const direction =
                transfer.toAccountId === visibilityPartyId
                  ? "received"
                  : transfer.fromAccountId === visibilityPartyId
                    ? "sent"
                    : asset.accountId === visibilityPartyId
                      ? transfer.toAccountId === asset.accountId
                        ? "received"
                        : "sent"
                      : "sent"
              const DirectionIcon =
                direction === "sent" ? ArrowUpRight : ArrowDownLeft
              const counterpartyId =
                direction === "sent"
                  ? transfer.toAccountId
                  : transfer.fromAccountId
              const counterparty = accountById(counterpartyId)

              return (
                <div
                  key={transfer.id}
                  className="flex gap-3 border-b border-border p-4 last:border-b-0"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <DirectionIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {direction === "sent" ? "Sent to" : "Received from"}{" "}
                      {counterparty?.name ?? counterpartyId}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatTons(transfer.quantity)}t ·{" "}
                      {formatTransferDate(transfer.occurredAt ?? transfer.createdAt)}
                    </p>
                    {transfer.attachments && transfer.attachments.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {transfer.attachments.length} supporting document
                        {transfer.attachments.length === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {originEvidence.length > 0 ? (
        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Origin evidence references
          </h2>
          <div className="overflow-hidden rounded-lg border bg-background">
            {originEvidence.map((item: OriginEvidenceReference) => (
              <div
                key={item.id}
                className="border-b border-border p-4 last:border-b-0"
              >
                <p className="font-medium">{item.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.documentType ?? item.mimeType}
                  {item.issuer ? ` · ${item.issuer}` : ""}
                  {item.timestamp
                    ? ` · ${formatTransferDate(item.timestamp)}`
                    : ""}
                </p>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground select-all">
                  {item.hash}
                </p>
              </div>
            ))}
          </div>
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
          <div className="overflow-hidden rounded-lg border bg-background">
            {evidence.map((attachment) => (
              <div
                key={attachment.id}
                className="border-b border-border p-4 last:border-b-0"
              >
                <p className="font-medium">{attachment.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {attachment.mimeType} · {formatFileSize(attachment.size)} ·
                  Transfer {attachment.transferId}
                </p>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                  {attachment.hash}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
          <ShieldCheck className="size-4" />
          Attestation preview
        </h2>
        <div className="rounded-lg bg-muted px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            This lot can support a custody-chain attestation including:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-muted-foreground">
            <li>
              {commodity.label} · {formatTons(asset.quantity)}t with preserved
              certifications
            </li>
            <li>
              Current node: {holdingAccount?.name ?? asset.accountId}
            </li>
            <li>
              {partyTransfers.length} visible custody event
              {partyTransfers.length === 1 ? "" : "s"} for your party
            </li>
            <li>
              {originEvidence.length} origin evidence reference
              {originEvidence.length === 1 ? "" : "s"} with ledger-bound hashes
            </li>
            <li>
              {evidence.length} transfer evidence reference
              {evidence.length === 1 ? "" : "s"} with ledger-bound hashes
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Full attestation generation will summarize the complete chain when
            the shipment reaches a receiving port terminal account.
          </p>
        </div>
      </section>
    </div>
  )
}
