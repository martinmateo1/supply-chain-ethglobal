"use client"

import { useMemo, useState } from "react"
import { ArrowLeftRight, X } from "lucide-react"

import { CertificateDropzone } from "@/components/certificate-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useCustodyGateway } from "@/hooks/use-custody-gateway"
import { suggestNextCustodyStep } from "@/lib/demo/custody-route"
import { useTraceabilityStore } from "@/lib/store"
import {
  COMMODITY_META,
  STAGE_META,
  assetKey,
  type Asset,
  type TransferAttachment,
} from "@/lib/types"
import { formatTons } from "@/lib/utils"
import { deterministicHash, tokenId } from "@/lib/provenance"

type TransferPanelProps = {
  onClose: () => void
  fromAccountId: string
}

function assetLabel(asset: Asset): string {
  const commodity = COMMODITY_META[asset.commodity].label
  const certs = asset.certifications
    .map((c) => (c === "non-gmo" ? "NON-GMO" : "Deforestation-free"))
    .join(", ")
  return `${commodity} · ${certs} · ${asset.rating} · ${formatTons(asset.quantity)}t`
}

export function TransferPanel({ onClose, fromAccountId }: TransferPanelProps) {
  const accounts = useTraceabilityStore((state) => state.accounts)
  const assetsByAccount = useTraceabilityStore((state) => state.assetsByAccount)
  const accountTotalTons = useTraceabilityStore((state) => state.accountTotalTons)
  const availableQuantityForAsset = useTraceabilityStore(
    (state) => state.availableQuantityForAsset
  )

  const { initiateTransfer, isSubmitting, error, clearError } = useCustodyGateway()

  const fromAccount = accounts.find((account) => account.id === fromAccountId)
  const [toAccountId, setToAccountId] = useState("")
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [quantityStr, setQuantityStr] = useState("")
  const [attachments, setAttachments] = useState<TransferAttachment[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submittedQuantity, setSubmittedQuantity] = useState(0)

  const fromAssets = useMemo(
    () => assetsByAccount(fromAccountId),
    [assetsByAccount, fromAccountId]
  )

  const selectedAsset = fromAssets.find((a) => a.id === selectedAssetId)
  const toAccount = accounts.find((a) => a.id === toAccountId)
  const quantity = parseFloat(quantityStr) || 0
  const maxQuantity = selectedAssetId
    ? availableQuantityForAsset(selectedAssetId)
    : 0
  const isQuantityValid = quantity > 0 && quantity <= maxQuantity
  // Route-aware ordering: the configured next custody hop is surfaced first and
  // labeled, but any destination remains selectable (suggestion, not a lock).
  const suggestedNextId = suggestNextCustodyStep(fromAccountId)
  const toAccounts = accounts
    .filter((a) => a.id !== fromAccountId)
    .sort((a, b) => {
      if (a.id === suggestedNextId) return -1
      if (b.id === suggestedNextId) return 1
      return 0
    })
  const canConfirm =
    !!fromAccountId &&
    !!toAccountId &&
    !!selectedAssetId &&
    isQuantityValid &&
    !isSubmitting

  const provenanceHash = selectedAsset
    ? deterministicHash(
        `${assetKey(selectedAsset.commodity, selectedAsset.certifications)}:${selectedAsset.rating}`
      )
    : null

  const isSplit = !!selectedAsset && quantity > 0 && quantity < maxQuantity
  const remainingAfterSplit = isSplit ? maxQuantity - quantity : 0

  async function handleConfirm() {
    if (!canConfirm) return
    clearError()

    const result = await initiateTransfer({
      fromAccountId,
      toAccountId,
      assetId: selectedAssetId,
      quantity,
      attachments,
    })

    if (result.ok) {
      setSubmittedQuantity(quantity)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
          <h2 className="flex-1 text-base font-semibold">Transfer custody</h2>
        </div>

        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ArrowLeftRight className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Custody transfer requested</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatTons(submittedQuantity)}t is pending acceptance at the
              destination operational node.
              {attachments.length > 0
                ? ` ${attachments.length} evidence reference${attachments.length === 1 ? "" : "s"} bound to this handoff.`
                : ""}
            </p>
          </div>
          <Button className="mt-2 w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onClose}
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close panel"
        >
          <X className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Transfer custody</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Initiate a custody transfer from your operational node.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {fromAccount ? (
          <div className="space-y-1.5">
            <Label>From operational node</Label>
            <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              {(() => {
                const FromIcon = STAGE_META[fromAccount.stageType].icon
                return (
                  <>
                    <FromIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{fromAccount.name}</span>
                    <span className="ml-auto text-muted-foreground">
                      {formatTons(accountTotalTons(fromAccount.id))}t
                    </span>
                  </>
                )
              })()}
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="asset-select">Lot position</Label>
          <Select
            value={selectedAssetId}
            onValueChange={(id) => {
              setSelectedAssetId(id)
              setQuantityStr("")
              clearError()
            }}
            disabled={fromAssets.length === 0}
          >
            <SelectTrigger id="asset-select" className="w-full">
              <SelectValue
                placeholder={
                  fromAssets.length === 0
                    ? "No lot positions at this node"
                    : "Select lot position"
                }
              />
            </SelectTrigger>
            <SelectContent position="popper">
              {fromAssets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {assetLabel(asset)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <div className="relative">
            <input
              id="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              step={50}
              value={quantityStr}
              onChange={(e) => {
                setQuantityStr(e.target.value)
                clearError()
              }}
              disabled={!selectedAssetId}
              placeholder="0"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 pr-12 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              tons
            </span>
          </div>
          {selectedAsset && (
            <p className="text-xs text-muted-foreground">
              Available: {formatTons(maxQuantity)}t
              {maxQuantity < selectedAsset.quantity
                ? ` (${formatTons(selectedAsset.quantity - maxQuantity)}t locked by pending transfers)`
                : null}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="to-account">To operational node</Label>
          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger id="to-account" className="w-full">
              <SelectValue placeholder="Select operational node" />
            </SelectTrigger>
            <SelectContent position="popper">
              {toAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} — {formatTons(accountTotalTons(account.id))}t
                  {account.id === suggestedNextId ? " · Next custody step" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CertificateDropzone
          attachments={attachments}
          onChange={setAttachments}
          disabled={!selectedAssetId}
        />

        <div className="rounded-lg bg-muted px-4 py-3 text-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {isSplit ? "Split Summary" : "Transfer Summary"}
            </p>
            {isSplit ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                Split
              </span>
            ) : null}
          </div>

          {isSplit && selectedAsset ? (
            <>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-muted-foreground">Before (source)</span>
                <span className="font-medium tabular-nums">
                  {formatTons(maxQuantity)}t
                </span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-muted-foreground">Transfer</span>
                <span className="font-medium tabular-nums">
                  {formatTons(quantity)}t
                </span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-muted-foreground">Remaining (source)</span>
                <span className="font-medium tabular-nums">
                  {formatTons(remainingAfterSplit)}t
                </span>
              </div>
              <Separator className="my-1" />
              <p className="py-1.5 text-xs leading-relaxed text-muted-foreground">
                Quantity is conserved: {formatTons(quantity)}t transferred +{" "}
                {formatTons(remainingAfterSplit)}t remaining ={" "}
                {formatTons(maxQuantity)}t source.
              </p>
              <Separator className="my-1" />
            </>
          ) : null}

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">
              {isSplit ? "Source reference" : "Batch ID"}
            </span>
            <span className="font-mono text-xs font-medium">
              {selectedAsset ? tokenId(selectedAsset.id) : "—"}
            </span>
          </div>
          <Separator className="my-1" />

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Origin fingerprint</span>
            <span className="font-mono text-xs font-medium">
              {provenanceHash ?? "—"}
            </span>
          </div>
          <Separator className="my-1" />

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Custody handover</span>
            {toAccount ? (
              <span className="flex items-center gap-1.5 font-medium">
                {(() => {
                  const ToIcon = STAGE_META[toAccount.stageType].icon
                  return (
                    <>
                      <ToIcon className="size-3.5 text-muted-foreground" />
                      {toAccount.name}
                    </>
                  )
                })()}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <Separator className="my-1" />

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Supporting documentation</span>
            <span className="text-xs font-medium">
              {attachments.length > 0
                ? `${attachments.length} attached`
                : "None"}
            </span>
          </div>
          <Separator className="my-1" />

          <p className="py-1.5 text-xs leading-relaxed text-muted-foreground">
            Custody moves only after the destination party accepts this transfer.
          </p>
          <Separator className="my-1" />

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Record ID</span>
            <span className="text-xs text-muted-foreground">
              Assigned on confirmation
            </span>
          </div>
          <Separator className="my-1" />

          <div className="flex items-center justify-between py-1.5">
            <span className="font-medium">Total amount</span>
            <span className="font-semibold">
              {quantity > 0 ? `${formatTons(quantity)}t` : "—"}
            </span>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full"
          disabled={!canConfirm}
          onClick={() => void handleConfirm()}
        >
          {isSubmitting ? "Submitting…" : "Request custody transfer"}
        </Button>
      </div>
    </div>
  )
}
