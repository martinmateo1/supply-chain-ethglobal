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
  const addTransfer = useTraceabilityStore((state) => state.addTransfer)

  const fromAccount = accounts.find((account) => account.id === fromAccountId)
  const [toAccountId, setToAccountId] = useState("")
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [quantityStr, setQuantityStr] = useState("")
  const [attachments, setAttachments] = useState<TransferAttachment[]>([])
  const [submitted, setSubmitted] = useState(false)

  const fromAssets = useMemo(
    () => assetsByAccount(fromAccountId),
    [assetsByAccount, fromAccountId]
  )

  const selectedAsset = fromAssets.find((a) => a.id === selectedAssetId)
  const toAccount = accounts.find((a) => a.id === toAccountId)
  const quantity = parseFloat(quantityStr) || 0
  const maxQuantity = selectedAsset?.quantity ?? 0
  const isQuantityValid = quantity > 0 && quantity <= maxQuantity
  const toAccounts = accounts.filter((a) => a.id !== fromAccountId)
  const canConfirm =
    !!fromAccountId && !!toAccountId && !!selectedAssetId && isQuantityValid

  const provenanceHash = selectedAsset
    ? deterministicHash(
        `${assetKey(selectedAsset.commodity, selectedAsset.certifications)}:${selectedAsset.rating}`
      )
    : null

  function handleConfirm() {
    if (!canConfirm) return
    addTransfer({
      fromAccountId,
      toAccountId,
      assetId: selectedAssetId,
      quantity,
      attachments,
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Transfer Assets</h2>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ArrowLeftRight className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Transfer confirmed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatTons(quantity)}t has been transferred successfully.
              {attachments.length > 0
                ? ` ${attachments.length} supporting document${attachments.length === 1 ? "" : "s"} attached.`
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Transfer Assets</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Send assets from your current account.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close panel"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-5">
        {fromAccount ? (
          <div className="space-y-1.5">
            <Label>From Account</Label>
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
          <Label htmlFor="asset-select">Asset</Label>
          <Select
            value={selectedAssetId}
            onValueChange={(id) => {
              setSelectedAssetId(id)
              setQuantityStr("")
            }}
            disabled={fromAssets.length === 0}
          >
            <SelectTrigger id="asset-select" className="w-full">
              <SelectValue
                placeholder={
                  fromAssets.length === 0
                    ? "No assets in this account"
                    : "Select asset"
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
              onChange={(e) => setQuantityStr(e.target.value)}
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
              Available: {formatTons(selectedAsset.quantity)}t
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="to-account">To Account</Label>
          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger id="to-account" className="w-full">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent position="popper">
              {toAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} — {formatTons(accountTotalTons(account.id))}t
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
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Transfer Summary
          </p>

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Batch ID</span>
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
            This transfer creates a permanent, tamper-proof audit trail.
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

        <Button className="w-full" disabled={!canConfirm} onClick={handleConfirm}>
          Confirm Transfer
        </Button>
      </div>
    </div>
  )
}
