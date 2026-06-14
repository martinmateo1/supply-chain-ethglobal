"use client"

import { useMemo, useState } from "react"
import { Combine, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCustodyGateway } from "@/hooks/use-custody-gateway"
import { lotsAreCompatible } from "@/lib/demo/custody-service"
import { tokenId } from "@/lib/provenance"
import { useTraceabilityStore } from "@/lib/store"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  RATING_META,
  type Asset,
} from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type CombinePanelProps = {
  onClose: () => void
  accountId: string
}

function certLabels(asset: Asset): string {
  if (asset.certifications.length === 0) return "Standard"
  return asset.certifications
    .map((cert) => CERTIFICATION_META[cert].label)
    .join(", ")
}

export function CombinePanel({ onClose, accountId }: CombinePanelProps) {
  const assetsByAccount = useTraceabilityStore((state) => state.assetsByAccount)
  const availableQuantityForAsset = useTraceabilityStore(
    (state) => state.availableQuantityForAsset
  )
  const { combineLots, isSubmitting, error, clearError } = useCustodyGateway()

  const nodeAssets = useMemo(
    () => assetsByAccount(accountId),
    [assetsByAccount, accountId]
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [combinedQuantity, setCombinedQuantity] = useState(0)

  const selectedAssets = useMemo(
    () => nodeAssets.filter((a) => selectedIds.includes(a.id)),
    [nodeAssets, selectedIds]
  )

  // Compatibility is anchored to the first selected lot; everything else must match it.
  const anchor = selectedAssets[0]
  const incompatibility = useMemo(() => {
    if (!anchor) return null
    for (const candidate of selectedAssets.slice(1)) {
      const result = lotsAreCompatible(anchor, candidate)
      if (!result.compatible) return result.reason
    }
    return null
  }, [anchor, selectedAssets])

  const reservedSelected = useMemo(
    () =>
      selectedAssets.some(
        (a) => availableQuantityForAsset(a.id) < a.quantity
      ),
    [selectedAssets, availableQuantityForAsset]
  )

  const projectedQuantity = selectedAssets.reduce((sum, a) => sum + a.quantity, 0)

  const canCombine =
    selectedIds.length >= 2 &&
    !incompatibility &&
    !reservedSelected &&
    !isSubmitting

  function toggle(assetId: string) {
    clearError()
    setSelectedIds((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    )
  }

  // A lot is selectable only when it matches the anchor's commodity/cert/rating.
  function isSelectable(asset: Asset): boolean {
    if (!anchor || asset.id === anchor.id) return true
    if (selectedIds.includes(asset.id)) return true
    return lotsAreCompatible(anchor, asset).compatible
  }

  async function handleConfirm() {
    if (!canCombine) return
    clearError()

    const result = await combineLots({ accountId, lotIds: selectedIds })
    if (result.ok) {
      setCombinedQuantity(result.asset.quantity)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold">Combine lot positions</h2>
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Combine className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Lot positions combined</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatTons(combinedQuantity)}t consolidated into a single lot
              position. Provenance links to all source lots are preserved.
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
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Combine lot positions</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Aggregate compatible stored lots into a single position. Only lots
            with the same commodity, certifications, and grade can combine.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close panel"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Lot positions at this node</Label>
          {nodeAssets.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
              No lot positions are held at this operational node.
            </p>
          ) : (
            <div className="space-y-2">
              {nodeAssets.map((asset) => {
                const selected = selectedIds.includes(asset.id)
                const selectable = isSelectable(asset)
                const reserved =
                  availableQuantityForAsset(asset.id) < asset.quantity
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggle(asset.id)}
                    disabled={!selectable}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-input bg-background hover:bg-muted/50",
                      !selectable && "cursor-not-allowed opacity-40"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {selected ? <span className="text-[10px]">✓</span> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {COMMODITY_META[asset.commodity].label}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatTons(asset.quantity)}t
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {tokenId(asset.id)} · Grade{" "}
                        {RATING_META[asset.rating].label} · {certLabels(asset)}
                        {reserved ? " · reserved by pending transfer" : ""}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedIds.length > 0 ? (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Combine Summary
            </p>

            {selectedAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {tokenId(asset.id)}
                </span>
                <span className="font-medium tabular-nums">
                  {formatTons(asset.quantity)}t
                </span>
              </div>
            ))}
            <Separator className="my-1" />
            <div className="flex items-center justify-between gap-3 py-1.5">
              <span className="font-medium">Combined quantity</span>
              <span className="font-semibold tabular-nums">
                {formatTons(projectedQuantity)}t
              </span>
            </div>
            {anchor ? (
              <>
                <Separator className="my-1" />
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-muted-foreground">Certifications</span>
                  <span className="font-medium">{certLabels(anchor)}</span>
                </div>
              </>
            ) : null}
            <Separator className="my-1" />
            <p className="py-1.5 text-xs leading-relaxed text-muted-foreground">
              Quantity is conserved: the combined lot equals the exact sum of the
              selected sources. Provenance links to every source lot are kept.
            </p>
          </div>
        ) : null}

        {incompatibility ? (
          <p className="text-sm text-destructive" role="alert">
            {incompatibility}
          </p>
        ) : null}

        {reservedSelected && !incompatibility ? (
          <p className="text-sm text-destructive" role="alert">
            A selected lot is reserved by a pending transfer and cannot be
            combined until that transfer is accepted or rejected.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full"
          disabled={!canCombine}
          onClick={() => void handleConfirm()}
        >
          {isSubmitting ? "Combining…" : "Combine lot positions"}
        </Button>
      </div>
    </div>
  )
}
