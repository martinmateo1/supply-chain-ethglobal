"use client"

import { useState } from "react"
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Paperclip } from "lucide-react"

import { CommodityThumbnail } from "@/components/commodity-thumbnail"
import { EvidenceReferenceList } from "@/components/evidence-reference-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  RATING_META,
  type Transfer,
  type TransferStatus,
} from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type TransferActionState = {
  transferId: string
  kind: "accept" | "reject"
} | null

type TransferRowProps = {
  transfer: Transfer
  counterpartyName: string
  direction: "sent" | "received"
  showActions?: boolean
  onAccept?: (transferId: string) => void
  onReject?: (transferId: string) => void
  actionState?: TransferActionState
}

function formatTransferDate(transfer: Transfer): string {
  const iso = transfer.occurredAt ?? transfer.createdAt
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

function statusLabel(status: TransferStatus): string {
  switch (status) {
    case "pending":
      return "Pending"
    case "accepted":
      return "Accepted"
    case "rejected":
      return "Rejected"
    case "cancelled":
      return "Cancelled"
  }
}

function statusClassName(status: TransferStatus): string {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
    case "cancelled":
      return "border-border bg-muted text-muted-foreground"
  }
}

export function TransferRow({
  transfer,
  counterpartyName,
  direction,
  showActions = false,
  onAccept,
  onReject,
  actionState = null,
}: TransferRowProps) {
  const [expanded, setExpanded] = useState(false)
  const commodity = COMMODITY_META[transfer.commodity]
  const rating = RATING_META[transfer.rating]
  const DirectionIcon = direction === "sent" ? ArrowUpRight : ArrowDownLeft
  const hasEvidence = Boolean(transfer.attachments?.length)
  const isThisRowBusy = actionState?.transferId === transfer.id
  const isAccepting = isThisRowBusy && actionState?.kind === "accept"
  const isRejecting = isThisRowBusy && actionState?.kind === "reject"

  return (
    <div
      role="listitem"
      className="border-b border-border p-4 last:border-b-0"
    >
      <div className="flex w-full items-center gap-3">
        <div className="relative size-12 shrink-0">
          <div className="flex size-full items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted">
            <DirectionIcon className="size-5 text-muted-foreground/60" />
          </div>
          <span
            className="absolute -right-0.5 -bottom-0.5 overflow-hidden rounded-md border border-border bg-background"
            aria-hidden
          >
            <CommodityThumbnail
              commodity={transfer.commodity}
              certifications={transfer.certifications}
              size={20}
              className="rounded-md border-0"
              imageClassName="rounded-md"
            />
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 min-w-0 line-clamp-1 text-base leading-snug font-medium">
              {commodity.label}{" "}
              <span className="font-normal text-muted-foreground">
                {direction === "sent" ? "to" : "from"}
              </span>{" "}
              {counterpartyName}
            </p>
            <p className="m-0 shrink-0 text-base leading-snug font-medium whitespace-nowrap">
              <span className="tabular-nums">{formatTons(transfer.quantity)}</span>
              <span className="font-normal text-muted-foreground">
                {" "}
                {transfer.unit}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="m-0 flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-snug text-muted-foreground">
              <Badge
                className={cn(
                  "size-5 shrink-0 rounded-md border-none p-1 text-xs leading-none",
                  rating.className
                )}
              >
                {rating.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs", statusClassName(transfer.status))}
              >
                {statusLabel(transfer.status)}
              </Badge>
              {transfer.certifications.length > 0 ? (
                <>
                  <span className="text-foreground">Certifications</span>
                  <span>
                    {transfer.certifications
                      .map((cert) => CERTIFICATION_META[cert].label)
                      .join(" · ")}
                  </span>
                </>
              ) : (
                <span>Standard batch</span>
              )}
              {hasEvidence ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="size-3" />
                    {transfer.attachments!.length} doc
                    {transfer.attachments!.length === 1 ? "" : "s"}
                  </span>
                </>
              ) : null}
              {transfer.sourceProvenanceRef ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <span>Origin</span>
                    <span className="select-all font-mono text-xs">
                      {transfer.sourceProvenanceRef}
                    </span>
                  </span>
                </>
              ) : null}
            </p>
            <Button
              type="button"
              variant="link"
              size="xs"
              className="m-0 h-auto min-h-0 min-w-0 shrink-0 p-0 text-sm leading-snug text-muted-foreground"
            >
              {formatTransferDate(transfer)}
            </Button>
          </div>
        </div>

        {hasEvidence ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="size-8 shrink-0 p-0"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide evidence" : "Show evidence"}
            onClick={() => setExpanded((value) => !value)}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </Button>
        ) : null}
      </div>

      {expanded && hasEvidence ? (
        <div className="mt-4 pl-[60px]">
          <EvidenceReferenceList attachments={transfer.attachments!} compact />
        </div>
      ) : null}

      {showActions && transfer.status === "pending" ? (
        <div className="mt-4 flex gap-2 pl-[60px]">
          <Button
            size="sm"
            disabled={isThisRowBusy}
            onClick={() => onAccept?.(transfer.id)}
          >
            {isAccepting ? "Accepting…" : "Accept transfer"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isThisRowBusy}
            onClick={() => onReject?.(transfer.id)}
          >
            {isRejecting ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
