"use client"

import { useCallback, useEffect, useState } from "react"

import { useLedgerConfig } from "@/hooks/use-ledger-config"
import type { ApiResponse } from "@/lib/api/response"
import type { CustodySnapshot } from "@/lib/demo/custody-service"
import { useTraceabilityStore } from "@/lib/store"

type TransferHistory = {
  sent: CustodySnapshot["transfers"]
  received: CustodySnapshot["transfers"]
  pendingInbound: CustodySnapshot["transfers"]
  pendingOutbound: CustodySnapshot["transfers"]
}

async function postLedger<T>(path: string, body: unknown): Promise<T | null> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as ApiResponse<T>
  if (!payload.ok) {
    throw new Error(payload.error.message)
  }
  return payload.data ?? null
}

export function useLedgerSync() {
  const selectedPartyViewId = useTraceabilityStore(
    (state) => state.selectedPartyViewId,
  )
  const applyCustodySnapshot = useTraceabilityStore(
    (state) => state.applyCustodySnapshot,
  )

  const { backend, isCantonBackend } = useLedgerConfig()

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const loadSnapshot = useCallback(async (): Promise<{
    assets: CustodySnapshot["assets"]
    transfers: CustodySnapshot["transfers"]
  } | null> => {
    const [holdings, history] = await Promise.all([
      postLedger<CustodySnapshot>("/api/ledger/visible-holdings", {
        partyViewId: selectedPartyViewId,
      }),
      postLedger<TransferHistory>("/api/ledger/transfer-history", {
        partyViewId: selectedPartyViewId,
      }),
    ])

    if (!holdings) return null

    return {
      assets: holdings.assets,
      transfers: history
        ? [
            ...history.sent,
            ...history.received,
            ...history.pendingInbound,
            ...history.pendingOutbound,
          ]
        : holdings.transfers,
    }
  }, [selectedPartyViewId])

  const refreshFromLedger = useCallback(async () => {
    if (!isCantonBackend) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      const snapshot = await loadSnapshot()
      if (snapshot) applyCustodySnapshot(snapshot)
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Could not refresh ledger-backed custody state.",
      )
    } finally {
      setIsSyncing(false)
    }
  }, [applyCustodySnapshot, isCantonBackend, loadSnapshot])

  useEffect(() => {
    if (!isCantonBackend) return

    let cancelled = false

    async function sync() {
      setIsSyncing(true)
      setSyncError(null)

      try {
        const snapshot = await loadSnapshot()
        if (cancelled || !snapshot) return
        applyCustodySnapshot(snapshot)
      } catch (error) {
        if (!cancelled) {
          setSyncError(
            error instanceof Error
              ? error.message
              : "Could not refresh ledger-backed custody state.",
          )
        }
      } finally {
        if (!cancelled) setIsSyncing(false)
      }
    }

    void sync()

    return () => {
      cancelled = true
    }
  }, [applyCustodySnapshot, isCantonBackend, loadSnapshot])

  return {
    backend,
    isCantonBackend,
    isSyncing,
    syncError,
    refreshFromLedger,
  }
}
