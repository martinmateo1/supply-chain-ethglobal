"use client"

import { useState, useMemo } from "react"
import { ArrowLeftRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogCloseButton,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { useTraceabilityStore } from "@/lib/store"
import { COMMODITY_META, STAGE_META, type Asset } from "@/lib/types"
import { formatTons } from "@/lib/utils"

type TransferModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromAccountId: string
}

function assetLabel(asset: Asset): string {
  const commodity = COMMODITY_META[asset.commodity].label
  const certs = asset.certifications
    .map((c) => (c === "non-gmo" ? "NON-GMO" : "Deforestation-free"))
    .join(", ")
  return `${commodity} · ${certs} · ${asset.rating} · ${formatTons(asset.quantity)}t`
}

export function TransferModal({
  open,
  onOpenChange,
  fromAccountId,
}: TransferModalProps) {
  const accounts = useTraceabilityStore((state) => state.accounts)
  const assetsByAccount = useTraceabilityStore((state) => state.assetsByAccount)
  const accountTotalTons = useTraceabilityStore((state) => state.accountTotalTons)
  const { initiateTransfer } = useCustodyGateway()

  const fromAccount = accounts.find((account) => account.id === fromAccountId)
  const [toAccountId, setToAccountId] = useState("")
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [quantityStr, setQuantityStr] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const fromAssets = useMemo(
    () => assetsByAccount(fromAccountId),
    [assetsByAccount, fromAccountId]
  )

  const selectedAsset = fromAssets.find((a) => a.id === selectedAssetId)

  const quantity = parseFloat(quantityStr) || 0
  const maxQuantity = selectedAsset?.quantity ?? 0
  const isQuantityValid = quantity > 0 && quantity <= maxQuantity

  const toAccounts = accounts.filter((a) => a.id !== fromAccountId)

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  async function handleConfirm() {
    if (!toAccountId || !selectedAssetId || !isQuantityValid) return
    const result = await initiateTransfer({
      fromAccountId,
      toAccountId,
      assetId: selectedAssetId,
      quantity,
    })
    if (result.ok) setSubmitted(true)
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      // reset state on close
      setToAccountId("")
      setSelectedAssetId("")
      setQuantityStr("")
      setSubmitted(false)
    }
    onOpenChange(value)
  }

  const canConfirm =
    !!fromAccountId && !!toAccountId && !!selectedAssetId && isQuantityValid

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogCloseButton />

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <ArrowLeftRight className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Transfer confirmed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatTons(quantity)}t has been transferred successfully.
              </p>
            </div>
            <Button
              className="mt-2 w-full"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="mb-4">
              <DialogTitle>Transfer Assets</DialogTitle>
              <DialogDescription>
                Move commodities between connected accounts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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

              {/* Asset */}
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

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity to Transfer</Label>
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

              {/* To account */}
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
            </div>

            {/* Summary */}
            <div className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Estimated arrival</span>
                <span className="font-medium">Today, {today}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Transaction fee</span>
                <span className="font-medium">0 tons</span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between py-1.5">
                <span className="font-medium">Total amount</span>
                <span className="font-semibold">
                  {quantity > 0 ? `${formatTons(quantity)}t` : "—"}
                </span>
              </div>
            </div>

            <Button
              className="mt-4 w-full"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              Confirm Transfer
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
