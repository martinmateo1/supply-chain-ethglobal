import { ArrowDownLeft, ArrowUpRight, Paperclip } from "lucide-react"

import { CommodityThumbnail } from "@/components/commodity-thumbnail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  RATING_META,
  type Transfer,
} from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type TransferRowProps = {
  transfer: Transfer
  counterpartyName: string
  direction: "sent" | "received"
}

function formatTransferDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate))
}

export function TransferRow({
  transfer,
  counterpartyName,
  direction,
}: TransferRowProps) {
  const commodity = COMMODITY_META[transfer.commodity]
  const rating = RATING_META[transfer.rating]
  const DirectionIcon = direction === "sent" ? ArrowUpRight : ArrowDownLeft

  return (
    <div
      role="listitem"
      className="flex w-full items-center gap-3 border-b border-border p-4 last:border-b-0"
    >
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
            {transfer.attachments && transfer.attachments.length > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="size-3" />
                  {transfer.attachments.length} doc
                  {transfer.attachments.length === 1 ? "" : "s"}
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
            {formatTransferDate(transfer.occurredAt)}
          </Button>
        </div>
      </div>
    </div>
  )
}
