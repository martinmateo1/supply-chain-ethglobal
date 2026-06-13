"use client"

import { useMemo } from "react"

import { SankeyFlowChart } from "@/components/chart-supply-flow"
import { buildAssetCustodyFlow } from "@/lib/asset-custody-flow"
import { COMMODITY_FLOW_COLORS } from "@/lib/supply-chain-flow"
import type { Account, Asset, Transfer } from "@/lib/types"
import { COMMODITY_META } from "@/lib/types"

type AssetCustodyFlowChartProps = {
  asset: Asset
  accounts: Account[]
  transfers: Transfer[]
}

export function AssetCustodyFlowChart({
  asset,
  accounts,
  transfers,
}: AssetCustodyFlowChartProps) {
  const flow = useMemo(
    () => buildAssetCustodyFlow(asset, accounts, transfers),
    [asset, accounts, transfers]
  )

  const commodity = COMMODITY_META[asset.commodity]
  const hasRenderableFlow = flow.nodes.length > 0 && flow.links.length > 0

  return (
    <section className="mb-8 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Custody flow
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How this lot moved through the chain up to its current node.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2.5 rounded-[2px]"
            style={{ backgroundColor: COMMODITY_FLOW_COLORS[asset.commodity] }}
          />
          {commodity.label}
        </div>
      </div>

      {hasRenderableFlow ? (
        <SankeyFlowChart
          data={flow}
          className="h-[min(52vh,420px)] min-h-[280px] w-full sm:min-h-[320px]"
          ariaLabel={`Custody flow for ${commodity.label} lot ${asset.id}`}
        />
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {flow.nodes.length === 1
            ? "This lot is still at its origin node and has not entered the custody chain yet."
            : "Not enough custody history to render a flow diagram for this lot yet."}
        </div>
      )}
    </section>
  )
}
