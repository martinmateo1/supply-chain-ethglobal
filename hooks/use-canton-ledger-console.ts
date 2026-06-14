"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useLedgerConfig } from "@/hooks/use-ledger-config"
import type { ApiResponse } from "@/lib/api/response"
import {
  subscribeCantonCommandEvents,
  type CantonCommandEvent,
} from "@/lib/canton-console-events"
import type { LedgerTelemetry } from "@/lib/ledger/telemetry"
import {
  formatCommandLine,
  formatOffsetTick,
  formatTelemetryHeaderLines,
  trimLogLines,
} from "@/lib/ledger/telemetry"

const POLL_INTERVAL_MS = 1500

type LogLine = {
  id: string
  text: string
  tone: "default" | "header" | "offset" | "command" | "error"
  title?: string
}

let lineCounter = 0

function nextLineId(): string {
  lineCounter += 1
  return `canton-log-${lineCounter}`
}

function pushLine(
  lines: LogLine[],
  text: string,
  tone: LogLine["tone"],
  title?: string,
): LogLine[] {
  return trimLogLines([...lines, { id: nextLineId(), text, tone, title }])
}

async function fetchTelemetry(): Promise<LedgerTelemetry | null> {
  const response = await fetch("/api/ledger/telemetry")
  const payload = (await response.json()) as ApiResponse<
    LedgerTelemetry | { backend: "demo" }
  >

  if (!payload.ok) {
    throw new Error(payload.error.message)
  }

  if (payload.data && "backend" in payload.data && payload.data.backend === "demo") {
    return null
  }

  return payload.data as LedgerTelemetry
}

export function useCantonLedgerConsole() {
  const { isCantonBackend } = useLedgerConfig()
  const [lines, setLines] = useState<LogLine[]>([])
  const [collapsed, setCollapsed] = useState(false)

  const lastOffsetRef = useRef<string | null>(null)
  const headerShownRef = useRef(false)
  const lastErrorRef = useRef<string | null>(null)

  const appendCommandEvent = useCallback((event: CantonCommandEvent) => {
    setLines((current) =>
      pushLine(
        current,
        formatCommandLine(event.choice, event.template, event.partyHint),
        "command",
      ),
    )
  }, [])

  const pollTelemetry = useCallback(async () => {
    try {
      const telemetry = await fetchTelemetry()
      if (!telemetry) return

      setLines((current) => {
        let next = current

        if (!headerShownRef.current) {
          const headerLines = formatTelemetryHeaderLines(telemetry)
          for (let index = 0; index < headerLines.length; index += 1) {
            const headerLine = headerLines[index]
            const title =
              index === 1 ? telemetry.packageId : undefined
            next = pushLine(next, headerLine, "header", title)
          }
          headerShownRef.current = true
        }

        const previousOffset = lastOffsetRef.current
        if (
          previousOffset !== null &&
          previousOffset !== telemetry.ledgerEndOffset
        ) {
          next = pushLine(
            next,
            formatOffsetTick(previousOffset, telemetry.ledgerEndOffset),
            "offset",
          )
        }

        lastOffsetRef.current = telemetry.ledgerEndOffset
        lastErrorRef.current = null
        return next
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Canton telemetry polling failed."
      if (lastErrorRef.current === message) return
      lastErrorRef.current = message
      setLines((current) => pushLine(current, `error: ${message}`, "error"))
    }
  }, [])

  useEffect(() => {
    if (!isCantonBackend) return

    let cancelled = false

    async function poll() {
      if (cancelled) return
      await pollTelemetry()
    }

    void poll()
    const intervalId = window.setInterval(() => {
      void poll()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [isCantonBackend, pollTelemetry])

  useEffect(() => {
    if (!isCantonBackend) return

    return subscribeCantonCommandEvents((event) => {
      appendCommandEvent(event)
    })
  }, [appendCommandEvent, isCantonBackend])

  return {
    lines,
    collapsed,
    setCollapsed,
    isVisible: isCantonBackend,
  }
}
