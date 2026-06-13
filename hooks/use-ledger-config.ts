"use client"

import { useEffect, useState } from "react"

import type { ApiResponse } from "@/lib/api/response"
import {
  setClientLedgerBackend,
  type ClientLedgerBackend,
} from "@/lib/ledger/client-mode"

type LedgerConfig = {
  backend: ClientLedgerBackend
}

// Module-level cache so every consumer shares a single network round-trip,
// no matter how many components mount the hook.
let backendPromise: Promise<ClientLedgerBackend> | null = null

function fetchBackend(): Promise<ClientLedgerBackend> {
  if (!backendPromise) {
    backendPromise = (async () => {
      const response = await fetch("/api/ledger/config")
      const payload = (await response.json()) as ApiResponse<LedgerConfig>
      const backend: ClientLedgerBackend =
        payload.ok && payload.data ? payload.data.backend : "demo"
      setClientLedgerBackend(backend)
      return backend
    })().catch(() => {
      // Reset so a transient failure can be retried by the next mount.
      backendPromise = null
      return "demo" as ClientLedgerBackend
    })
  }
  return backendPromise
}

/**
 * Resolve the active ledger backend ("demo" | "canton") from the server.
 * Shared across hooks/components via a cached promise.
 */
export function useLedgerConfig(): {
  backend: ClientLedgerBackend
  isCantonBackend: boolean
  isResolved: boolean
} {
  const [backend, setBackend] = useState<ClientLedgerBackend | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchBackend().then((resolved) => {
      if (!cancelled) setBackend(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    backend: backend ?? "demo",
    isCantonBackend: backend === "canton",
    isResolved: backend !== null,
  }
}
