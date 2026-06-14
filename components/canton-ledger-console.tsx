"use client"

import { ChevronLeft, ChevronRight, Terminal } from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { useCantonLedgerConsole } from "@/hooks/use-canton-ledger-console"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

const toneClass: Record<
  ReturnType<typeof useCantonLedgerConsole>["lines"][number]["tone"],
  string
> = {
  default: "text-zinc-300",
  header: "text-sky-400",
  offset: "text-emerald-400",
  command: "text-zinc-100",
  error: "text-red-400",
}

export function CantonLedgerConsole() {
  const { lines, collapsed, setCollapsed, isVisible } = useCantonLedgerConsole()
  const logEndRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (collapsed) return
    logEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "end",
    })
  }, [collapsed, lines, prefersReducedMotion])

  if (!isVisible) return null

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-l border-zinc-800 bg-zinc-950 text-zinc-100",
        collapsed ? "w-10" : "w-[280px]",
      )}
      aria-label="Canton ledger activity log"
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-zinc-800 px-2 py-2",
          collapsed && "justify-center px-1",
        )}
      >
        {!collapsed ? (
          <>
            <Terminal className="size-3.5 shrink-0 text-sky-400" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-sky-400">
              Canton ledger
            </span>
          </>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? "Expand Canton ledger console" : "Collapse Canton ledger console"
          }
        >
          {collapsed ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>

      {!collapsed ? (
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-2 font-mono text-[11px] leading-relaxed"
          aria-live="polite"
          aria-relevant="additions"
        >
          {lines.length === 0 ? (
            <p className="text-zinc-500">Connecting to Canton telemetry…</p>
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
      ) : null}
    </aside>
  )
}
