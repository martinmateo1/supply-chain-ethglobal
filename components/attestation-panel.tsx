"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ShieldCheck,
  ShieldX,
} from "lucide-react"

import { AttestationCard } from "@/components/attestation-card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  buildShareablePayload,
  evaluateAttestationReadiness,
  generateAttestation,
  type ShareableAttestation,
} from "@/lib/demo/attestation"
import { isLedgerError } from "@/lib/ledger/errors"
import { useTraceabilityStore } from "@/lib/store"
import type { Asset, StageType } from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type AttestationPanelProps = {
  asset: Asset
}

/**
 * Attestation readiness + generation panel (Stories 4.1 & 4.2).
 * Read-only projection over store custody state; generation is gated by
 * readiness and never emits a partial proof.
 */
export function AttestationPanel({ asset }: AttestationPanelProps) {
  const assets = useTraceabilityStore((state) => state.assets)
  const transfers = useTraceabilityStore((state) => state.transfers)
  const accounts = useTraceabilityStore((state) => state.accounts)
  const selectedPartyViewId = useTraceabilityStore(
    (state) => state.selectedPartyViewId
  )

  const [attestation, setAttestation] = useState<ShareableAttestation | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const readiness = useMemo(
    () =>
      evaluateAttestationReadiness(
        asset,
        { assets, transfers },
        selectedPartyViewId
      ),
    [asset, assets, transfers, selectedPartyViewId]
  )

  const nodeLabel = (id: string) =>
    accounts.find((account) => account.id === id)?.name ?? id
  const nodeStage = (id: string): StageType | null =>
    accounts.find((account) => account.id === id)?.stageType ?? null

  // AC4: unauthorized / private party views see no attestation details.
  if (!readiness.summary) {
    return (
      <section className="space-y-3">
        <SectionHeading />
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          {readiness.gaps[0]?.message ??
            "Attestation details are not available to this Party View."}
        </div>
      </section>
    )
  }

  const { summary, status } = readiness
  const canGenerate = status !== "blocked"

  const handleGenerate = () => {
    setError(null)
    setCopied(false)
    try {
      const generated = generateAttestation(
        asset,
        { assets, transfers },
        selectedPartyViewId
      )
      setAttestation(buildShareablePayload(generated))
    } catch (err) {
      setError(
        isLedgerError(err)
          ? err.message
          : "Attestation could not be generated."
      )
    }
  }

  const handleCopy = async () => {
    if (!attestation) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(attestation, null, 2))
      setCopied(true)
    } catch {
      setError("Could not copy the proof to the clipboard.")
    }
  }

  return (
    <section className="space-y-3">
      <SectionHeading />

      <div className="rounded-lg border bg-background p-4 text-sm">
        <StatusBanner status={status} />

        <div className="mt-3 space-y-2">
          <SummaryRow label="Commodity">
            {summary.commodity === "coffee" ? "Coffee beans" : "Cacao"}
          </SummaryRow>
          <SummaryRow label="Quantity">
            {formatTons(summary.quantity)} {summary.unit}
          </SummaryRow>
          <SummaryRow label="Current node">
            {nodeLabel(summary.currentNode)}
          </SummaryRow>
          <SummaryRow label="Issuer">{nodeLabel(summary.issuer)}</SummaryRow>
          <SummaryRow label="Recipient">{summary.recipient}</SummaryRow>
          <SummaryRow label="Custody path">
            <Check ok={summary.custodyComplete}>
              {summary.custodyStepCount} step
              {summary.custodyStepCount === 1 ? "" : "s"}
              {summary.custodyComplete ? " · complete" : " · incomplete"}
            </Check>
          </SummaryRow>
          <SummaryRow label="Provenance">
            <Check ok={summary.provenanceContinuous}>
              {summary.provenanceContinuous ? "Continuous" : "Discontinuous"}
            </Check>
          </SummaryRow>
          <SummaryRow label="Evidence">
            <Check ok={summary.evidenceComplete} warn={!summary.evidenceComplete}>
              {summary.evidenceCount} bound reference
              {summary.evidenceCount === 1 ? "" : "s"}
              {summary.evidenceComplete ? "" : " · gaps"}
            </Check>
          </SummaryRow>
        </div>

        {readiness.gaps.length > 0 ? (
          <ul className="mt-3 space-y-1.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {readiness.gaps.map((gap) => (
              <li key={gap.code} className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <span>{gap.message}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <Separator className="my-4" />

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            <ShieldCheck className="size-4" />
            Generate attestation
          </Button>
          {!canGenerate ? (
            <span className="text-xs text-muted-foreground">
              Resolve the custody/provenance gaps above to enable generation.
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-xs text-destructive">{error}</p>
        ) : null}
      </div>

      {attestation ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Selective proof — only the fields below are shared.
            </p>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="size-3.5" />
              {copied ? "Copied" : "Copy proof"}
            </Button>
          </div>
          <AttestationCard
            attestation={attestation}
            nodeLabel={nodeLabel}
            nodeStage={nodeStage}
          />
        </div>
      ) : null}
    </section>
  )
}

function SectionHeading() {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
      <ShieldCheck className="size-4" />
      Custody-chain attestation
    </h2>
  )
}

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

function Check({
  ok,
  warn,
  children,
}: {
  ok: boolean
  warn?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        ok && !warn
          ? "text-emerald-600 dark:text-emerald-400"
          : warn
            ? "text-amber-600 dark:text-amber-400"
            : "text-rose-600 dark:text-rose-400"
      )}
    >
      {ok && !warn ? (
        <CheckCircle2 className="size-3.5" />
      ) : warn ? (
        <AlertTriangle className="size-3.5" />
      ) : (
        <ShieldX className="size-3.5" />
      )}
      {children}
    </span>
  )
}

function StatusBanner({
  status,
}: {
  status: "ready" | "warning" | "blocked"
}) {
  if (status === "ready") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="size-4" />
        Ready to attest — custody chain complete with bound evidence.
      </div>
    )
  }
  if (status === "warning") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <AlertTriangle className="size-4" />
        Custody chain complete, but some steps have no bound evidence. The proof
        will not imply evidence it does not have.
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
      <ShieldX className="size-4" />
      Not ready — the custody chain or provenance is incomplete.
    </div>
  )
}
