"use client"

import { Terminal } from "lucide-react"
import { useEffect, useRef } from "react"

import { useCantonLedgerConsole } from "@/hooks/use-canton-ledger-console"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

const toneClass: Record<
  ReturnType<typeof useCantonLedgerConsole>["lines"][number]["tone"],
  string
> = {
  default: "text-foreground/80",
  header: "text-foreground font-medium",
  offset: "text-emerald-700 dark:text-emerald-600",
  command: "text-foreground",
  error: "text-red-600 dark:text-red-500",
}

export function CantonLedgerConsole() {
  const { lines, isVisible } = useCantonLedgerConsole()
  const logEndRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    logEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "end",
    })
  }, [lines, prefersReducedMotion])

  if (!isVisible) return null

  return (
    <aside
      className="fixed bottom-4 left-4 z-50 flex h-[min(280px,40vh)] w-[min(304px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] flex-col overflow-hidden text-foreground opacity-50 transition-opacity hover:opacity-100 focus-within:opacity-100"
      aria-label="Canton ledger activity log"
    >
      <div className="flex items-center gap-2 px-1 py-2">
        <Terminal className="size-3.5 shrink-0 text-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
          Canton ledger
        </span>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-1 py-1 font-mono text-[11px] leading-relaxed"
        aria-live="polite"
        aria-relevant="additions"
      >
        {lines.length === 0 ? (
          <p className="text-muted-foreground">Connecting to Canton telemetry…</p>
        ) : (
          lines.map((line) => (
            <p
              key={line.id}
              className={cn("whitespace-pre-wrap break-all", toneClass[line.tone])}
              title={line.title}
            >
              {line.text}
            </p>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </aside>
  )
}
