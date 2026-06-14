"use client"

import { CommodityThumbnail } from "@/components/commodity-thumbnail"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ShareableAttestation } from "@/lib/demo/attestation"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  STAGE_META,
  type StageType,
} from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type AttestationCardProps = {
  attestation: ShareableAttestation
  /** Resolve an operational node id to a human label (optional). */
  nodeLabel?: (id: string) => string
  /** Resolve an operational node id to its stage type for the icon (optional). */
  nodeStage?: (id: string) => StageType | null
  className?: string
}

/**
 * Read-only render of a selectively-shared attestation. Used by both the issuer
 * (after generation) and the verifier. Shows ONLY whitelisted shared fields.
 */
export function AttestationCard({
  attestation,
  nodeLabel,
  nodeStage,
  className,
}: AttestationCardProps) {
  const commodity = COMMODITY_META[attestation.commodity]
  const label = (id: string) => nodeLabel?.(id) ?? id

  return (
    <div className={cn("rounded-lg border bg-background p-4 text-sm", className)}>
      <div className="flex gap-3">
        <CommodityThumbnail
          commodity={attestation.commodity}
          certifications={attestation.certifications}
          size={48}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{commodity.label}</p>
          <p className="text-xs text-muted-foreground">
            {formatTons(attestation.quantity)} {attestation.unit}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Attestation
          </p>
          <p className="max-w-[12rem] truncate font-mono text-xs" title={attestation.attestationId}>
            {attestation.attestationId}
          </p>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="flex items-center justify-between gap-3 py-1">
        <span className="text-muted-foreground">Issuer</span>
        <span className="font-medium">{label(attestation.issuer)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="text-muted-foreground">Recipient</span>
        <span className="font-medium">{attestation.recipient}</span>
      </div>
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="text-muted-foreground">Certifications</span>
        {attestation.certifications.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {attestation.certifications.map((cert) => (
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
          <span className="text-muted-foreground">None</span>
        )}
      </div>

      <Separator className="my-3" />

      <p className="mb-2 text-[11px] tracking-wide text-muted-foreground uppercase">
        Custody path
      </p>
      <ol className="space-y-2">
        {attestation.custodyPath.map((step, index) => {
          const stage = nodeStage?.(step.node) ?? null
          const StageIcon = stage ? STAGE_META[stage].icon : null
          return (
            <li
              key={`${step.node}-${index}`}
              className="flex items-start justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
            >
              <span className="flex items-center gap-1.5 font-medium">
                {StageIcon ? (
                  <StageIcon className="size-3.5 text-muted-foreground" />
                ) : null}
                {label(step.node)}
              </span>
              <span className="text-right text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {formatTons(step.quantity)} t
                </span>
                {step.evidenceHashes.length > 0 ? (
                  <span className="ml-2">
                    {step.evidenceHashes.length} evidence
                  </span>
                ) : (
                  <span className="ml-2 text-amber-600 dark:text-amber-400">
                    no evidence
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>

      {attestation.evidenceRefs.length > 0 ? (
        <>
          <Separator className="my-3" />
          <p className="mb-2 text-[11px] tracking-wide text-muted-foreground uppercase">
            Evidence references
          </p>
          <ul className="space-y-1">
            {attestation.evidenceRefs.map((hash) => (
              <li key={hash} className="truncate font-mono text-xs text-muted-foreground">
                {hash}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Generated {new Date(attestation.generatedAt).toLocaleString()}
      </p>
    </div>
  )
}
