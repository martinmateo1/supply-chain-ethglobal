"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react"

import { AppNavbar } from "@/components/app-navbar"
import { AttestationCard } from "@/components/attestation-card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  evidenceBindingReport,
  parseShareablePayload,
  verifyAttestation,
  type ShareableAttestation,
  type VerificationResult,
} from "@/lib/demo/attestation"
import { VERIFIER_PARTY_VIEW_ID } from "@/lib/demo/party-views"
import { useTraceabilityStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * In-App Verifier View (Story 4.3). Loads a shared attestation payload and
 * validates it using ONLY the payload content — no ledger / store custody data.
 * The verifier is a private Party View and never links to private custody pages.
 */
export function AttestationVerifier() {
  const selectedPartyViewId = useTraceabilityStore(
    (state) => state.selectedPartyViewId
  )
  const selectPartyView = useTraceabilityStore((state) => state.selectPartyView)
  const accounts = useTraceabilityStore((state) => state.accounts)

  const [raw, setRaw] = useState("")
  const [payload, setPayload] = useState<ShareableAttestation | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Node labels are public route metadata (company/stage names), not private
  // custody data — safe for the verifier to render for readability.
  const nodeLabel = (id: string) =>
    accounts.find((account) => account.id === id)?.name ?? id
  const nodeStage = (id: string) =>
    accounts.find((account) => account.id === id)?.stageType ?? null

  const binding = useMemo(
    () => (payload ? evidenceBindingReport(payload) : []),
    [payload]
  )

  const handleVerify = () => {
    setParseError(null)
    const parsed = parseShareablePayload(raw)
    if (!parsed) {
      setPayload(null)
      setResult(null)
      setParseError(
        "Could not read this proof. Paste the JSON payload copied from a generated attestation."
      )
      return
    }
    setPayload(parsed)
    setResult(verifyAttestation(parsed))
  }

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <AppNavbar
          selectedPartyViewId={selectedPartyViewId}
          onSelectPartyView={selectPartyView}
        />
        <div className="mx-auto w-full max-w-3xl px-6 pt-12 pb-24">
          <header className="mb-8 flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Attestation verifier</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Validate a custody-chain attestation from its selectively shared
                facts alone. No private custody, holdings, or counterparties are
                reachable from this view.
              </p>
            </div>
          </header>

          {selectedPartyViewId !== VERIFIER_PARTY_VIEW_ID ? (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Switch to the verifier Party View to inspect a shared proof.
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectPartyView(VERIFIER_PARTY_VIEW_ID)}
              >
                Use verifier view
              </Button>
            </div>
          ) : null}

          <section className="space-y-3">
            <label
              htmlFor="attestation-payload"
              className="text-sm font-medium"
            >
              Shared proof payload
            </label>
            <textarea
              id="attestation-payload"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              placeholder='Paste the attestation JSON here…'
              className="h-40 w-full resize-y rounded-lg border bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleVerify} disabled={raw.trim().length === 0}>
                <ShieldCheck className="size-4" />
                Verify proof
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/">Back to dashboard</Link>
              </Button>
            </div>
            {parseError ? (
              <p className="text-xs text-destructive">{parseError}</p>
            ) : null}
          </section>

          {payload && result ? (
            <section className="mt-8 space-y-4">
              <VerdictBanner result={result} />

              <div className="rounded-lg border bg-background p-4">
                <p className="mb-3 text-[11px] tracking-wide text-muted-foreground uppercase">
                  Verification checks
                </p>
                <div className="space-y-2 text-sm">
                  <CheckRow
                    ok={result.provenanceContinuous}
                    label="Provenance continuous"
                  />
                  <CheckRow
                    ok={result.certificationsPresent}
                    label="Certifications present"
                  />
                  <CheckRow
                    ok={result.evidenceReferenced}
                    label="Evidence referenced"
                  />
                  <CheckRow
                    ok={result.idAuthentic}
                    label="Attestation id authentic (untampered)"
                  />
                </div>

                {binding.length > 0 ? (
                  <>
                    <Separator className="my-3" />
                    <p className="mb-2 text-[11px] tracking-wide text-muted-foreground uppercase">
                      Evidence binding
                    </p>
                    <ul className="space-y-1.5 text-xs">
                      {binding.map((entry) => (
                        <li
                          key={entry.hash}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="truncate font-mono text-muted-foreground">
                            {entry.hash}
                          </span>
                          <span
                            className={cn(
                              "shrink-0",
                              entry.bound
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {entry.bound
                              ? `bound · ${nodeLabel(entry.boundToNode ?? "")}`
                              : "unbound"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {result.gaps.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    {result.gaps.map((gap) => (
                      <li key={gap} className="flex gap-2">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <AttestationCard
                attestation={payload}
                nodeLabel={nodeLabel}
                nodeStage={nodeStage}
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <XCircle className="size-4 text-rose-600 dark:text-rose-400" />
      )}
      <span className={cn(ok ? "" : "text-muted-foreground")}>{label}</span>
    </div>
  )
}

function VerdictBanner({ result }: { result: VerificationResult }) {
  if (result.verified) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="size-5" />
        Verified — provenance, certifications, and evidence all reconcile from
        the shared proof.
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
      <ShieldX className="size-5" />
      Incomplete — this proof does not fully verify. See the gaps below.
    </div>
  )
}
