"use client"

import Link from "next/link"
import {
  ArrowRight,
  Check,
  GitMerge,
  Scissors,
  Sprout,
  Truck,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type {
  ProvenanceOperationType,
  ProvenanceTimelineEntry,
} from "@/lib/demo/custody-service"
import { tokenId } from "@/lib/provenance"
import { cn, formatTons } from "@/lib/utils"

type OperationMeta = {
  label: string
  icon: LucideIcon
  className: string
}

const OPERATION_META: Record<ProvenanceOperationType, OperationMeta> = {
  origin: {
    label: "Origin",
    icon: Sprout,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  split: {
    label: "Split",
    icon: Scissors,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  combine: {
    label: "Combine",
    icon: GitMerge,
    className: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  transfer: {
    label: "Transfer",
    icon: Truck,
    className: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
}

type ProvenanceTimelineProps = {
  entries: ProvenanceTimelineEntry[]
  accountName: (id: string) => string
  isSourceVisible: (id: string) => boolean
}

export function ProvenanceTimeline({
  entries,
  accountName,
  isSourceVisible,
}: ProvenanceTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        No provenance steps are visible to this party for this lot yet.
      </div>
    )
  }

  return (
    <ol className="relative space-y-4">
      {entries.map((entry, index) => {
        const meta = OPERATION_META[entry.operationType]
        const Icon = meta.icon
        const isLast = index === entries.length - 1

        return (
          <li key={`${entry.operationType}-${index}`} className="relative flex gap-3">
            {/* Connector rail between steps. */}
            {!isLast ? (
              <span
                aria-hidden
                className="absolute top-8 left-[15px] h-[calc(100%+0.25rem)] w-px bg-border"
              />
            ) : null}
            <span
              className={cn(
                "z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                meta.className
              )}
            >
              <Icon className="size-4" />
            </span>

            <div className="flex-1 rounded-lg border bg-background p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("rounded-md border-none", meta.className)}>
                    {meta.label}
                  </Badge>
                  <span className="font-medium tabular-nums">
                    {formatTons(entry.quantity)} t
                  </span>
                </div>
                {entry.conserved ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3.5" />
                    Conserved
                  </span>
                ) : (
                  <span className="text-xs font-medium text-destructive">
                    Conservation violated
                  </span>
                )}
              </div>

              {/* Parties */}
              <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                {entry.fromAccountId ? (
                  <>
                    <span>{accountName(entry.fromAccountId)}</span>
                    <ArrowRight className="size-3.5" />
                  </>
                ) : null}
                {entry.toAccountId ? (
                  <span className="text-foreground">
                    {accountName(entry.toAccountId)}
                  </span>
                ) : null}
              </div>

              {/* Conservation arithmetic (split). */}
              {entry.beforeQuantity != null && entry.afterQuantity != null ? (
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {formatTons(entry.beforeQuantity)} t = {formatTons(entry.quantity)} t
                  moved + {formatTons(entry.afterQuantity)} t remaining
                </p>
              ) : null}

              {/* Source references (combine / provenance fingerprints). */}
              {entry.sourceRefs.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Sources:</span>
                  {entry.sourceRefs.map((ref) => {
                    const looksLikeLot = ref.startsWith("a")
                    if (looksLikeLot && isSourceVisible(ref)) {
                      return (
                        <Link
                          key={ref}
                          href={`/asset/${ref}`}
                          className="font-mono text-xs font-medium text-primary hover:underline"
                        >
                          {tokenId(ref)}
                        </Link>
                      )
                    }
                    return (
                      <span key={ref} className="font-mono text-xs">
                        {looksLikeLot ? tokenId(ref) : ref}
                      </span>
                    )
                  })}
                </div>
              ) : null}

              {/* Evidence bound to THIS step only. */}
              {entry.evidenceHashes.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Evidence:</span>
                  {entry.evidenceHashes.map((hash) => (
                    <span key={hash} className="font-mono text-xs">
                      {hash}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
