"use client"

import { useCallback, useState } from "react"

import { useLedgerConfig } from "@/hooks/use-ledger-config"
import type { ApiResponse } from "@/lib/api/response"
import type { CustodySnapshot } from "@/lib/demo/custody-service"
import type { InitiateTransferRequest } from "@/lib/demo/custody-service"
import { useTraceabilityStore } from "@/lib/store"
import type { Asset, Transfer, TransferAttachment } from "@/lib/types"

type CustodyMutationResult = {
  assets: Asset[]
  transfers: Transfer[]
  transfer: Transfer
}

type GatewayError = {
  code: string
  message: string
}

async function postCustody<T>(
  path: string,
  body: unknown,
): Promise<{ data?: T; error?: GatewayError }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as ApiResponse<T>
  if (!payload.ok) {
    return { error: payload.error }
  }

  return { data: payload.data }
}

export function useCustodyGateway() {
  const assets = useTraceabilityStore((state) => state.assets)
  const transfers = useTraceabilityStore((state) => state.transfers)
  const selectedPartyViewId = useTraceabilityStore(
    (state) => state.selectedPartyViewId,
  )
  const applyCustodySnapshot = useTraceabilityStore(
    (state) => state.applyCustodySnapshot,
  )

  const { isCantonBackend: isCanton } = useLedgerConfig()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getSnapshot = useCallback(
    (): CustodySnapshot => ({ assets, transfers }),
    [assets, transfers],
  )

  const initiateTransfer = useCallback(
    async (input: {
      fromAccountId: string
      toAccountId: string
      assetId: string
      quantity: number
      attachments?: TransferAttachment[]
    }) => {
      setIsSubmitting(true)
      setError(null)

      const request: InitiateTransferRequest & { snapshot?: CustodySnapshot } = {
        partyViewId: selectedPartyViewId,
        ...input,
      }

      if (!isCanton) {
        request.snapshot = getSnapshot()
      }

      const { data, error: gatewayError } = await postCustody<CustodyMutationResult>(
        "/api/ledger/initiate-transfer",
        request,
      )

      setIsSubmitting(false)

      if (gatewayError) {
        setError(gatewayError.message)
        return { ok: false as const, error: gatewayError.message }
      }

      if (data) {
        applyCustodySnapshot({ assets: data.assets, transfers: data.transfers })
        return { ok: true as const, transfer: data.transfer }
      }

      const fallback = "Custody transfer could not be submitted."
      setError(fallback)
      return { ok: false as const, error: fallback }
    },
    [applyCustodySnapshot, getSnapshot, isCanton, selectedPartyViewId],
  )

  const acceptTransfer = useCallback(
    async (transferId: string) => {
      setIsSubmitting(true)
      setError(null)

      const body: { partyViewId: string; transferId: string; snapshot?: CustodySnapshot } =
        {
          partyViewId: selectedPartyViewId,
          transferId,
        }

      if (!isCanton) {
        body.snapshot = getSnapshot()
      }

      const { data, error: gatewayError } = await postCustody<CustodyMutationResult>(
        "/api/ledger/accept-transfer",
        body,
      )

      setIsSubmitting(false)

      if (gatewayError) {
        setError(gatewayError.message)
        return { ok: false as const, error: gatewayError.message }
      }

      if (data) {
        applyCustodySnapshot({ assets: data.assets, transfers: data.transfers })
        return { ok: true as const, transfer: data.transfer }
      }

      const fallback = "Custody transfer could not be accepted."
      setError(fallback)
      return { ok: false as const, error: fallback }
    },
    [applyCustodySnapshot, getSnapshot, isCanton, selectedPartyViewId],
  )

  const rejectTransfer = useCallback(
    async (transferId: string) => {
      setIsSubmitting(true)
      setError(null)

      const body: { partyViewId: string; transferId: string; snapshot?: CustodySnapshot } =
        {
          partyViewId: selectedPartyViewId,
          transferId,
        }

      if (!isCanton) {
        body.snapshot = getSnapshot()
      }

      const { data, error: gatewayError } = await postCustody<CustodyMutationResult>(
        "/api/ledger/reject-transfer",
        body,
      )

      setIsSubmitting(false)

      if (gatewayError) {
        setError(gatewayError.message)
        return { ok: false as const, error: gatewayError.message }
      }

      if (data) {
        applyCustodySnapshot({ assets: data.assets, transfers: data.transfers })
        return { ok: true as const, transfer: data.transfer }
      }

      const fallback = "Custody transfer could not be rejected."
      setError(fallback)
      return { ok: false as const, error: fallback }
    },
    [applyCustodySnapshot, getSnapshot, isCanton, selectedPartyViewId],
  )

  return {
    initiateTransfer,
    acceptTransfer,
    rejectTransfer,
    isSubmitting,
    error,
    clearError: () => setError(null),
    isCantonBackend: isCanton,
  }
}
