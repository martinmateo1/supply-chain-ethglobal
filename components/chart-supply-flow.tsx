"use client"

import * as React from "react"
import {
  sankey,
  sankeyJustify,
  sankeyLinkHorizontal,
  type SankeyLink,
  type SankeyNode,
} from "d3-sankey"

import {
  COMMODITY_FLOW_COLORS,
  type FlowNodeKind,
  type FlowSankeyGraph,
  type FlowSankeyLink,
  type FlowSankeyNode,
} from "@/lib/supply-chain-flow"
import { COMMODITY_META, STAGE_META, type CommodityType } from "@/lib/types"
import { cn } from "@/lib/utils"

type LayoutNode = SankeyNode<FlowSankeyNode, FlowSankeyLink>
type LayoutLink = SankeyLink<FlowSankeyNode, FlowSankeyLink>

const MARGIN = { top: 24, right: 0, bottom: 24, left: 0 }
const NODE_WIDTH = 16
const LABEL_GAP = 10

type PorCommodityRow = { commodity: CommodityType; tons: number }

type SankeyHover =
  | {
      type: "link"
      x: number
      y: number
      sourceNombre: string
      targetNombre: string
      commodity: CommodityType
      tons: number
    }
  | {
      type: "node"
      x: number
      y: number
      nombre: string
      kind: FlowNodeKind
      tons: number
      porCommodity?: PorCommodityRow[]
      stock?: { stored: number; forwarded: number; remaining: number }
    }

function formatTons(value: number) {
  return `${Math.round(value).toLocaleString("en-US")} t`
}

function porCommodityFromTotals(
  totals: Map<CommodityType, number>
): PorCommodityRow[] {
  return Array.from(totals.entries())
    .map(([commodity, tons]) => ({ commodity, tons }))
    .sort((a, b) => b.tons - a.tons)
}

function getIncomingPorCommodity(
  nodeId: string,
  links: LayoutLink[]
): PorCommodityRow[] {
  const totals = new Map<CommodityType, number>()
  for (const link of links) {
    const target = link.target as LayoutNode
    if (target.id !== nodeId) continue
    totals.set(link.commodity, (totals.get(link.commodity) ?? 0) + (link.value ?? 0))
  }
  return porCommodityFromTotals(totals)
}

function getOutgoingPorCommodity(
  nodeId: string,
  links: LayoutLink[]
): PorCommodityRow[] {
  const totals = new Map<CommodityType, number>()
  for (const link of links) {
    const source = link.source as LayoutNode
    if (source.id !== nodeId) continue
    totals.set(link.commodity, (totals.get(link.commodity) ?? 0) + (link.value ?? 0))
  }
  return porCommodityFromTotals(totals)
}

function useContainerSize() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({
        width: Math.max(0, Math.floor(width)),
        height: Math.max(0, Math.floor(height)),
      })
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, ...size }
}

function buildSankeyLayout(
  graphData: FlowSankeyGraph,
  width: number,
  height: number
) {
  const generator = sankey<FlowSankeyNode, FlowSankeyLink>()
    .nodeId((node) => node.id)
    .nodeWidth(NODE_WIDTH)
    .nodePadding(20)
    .nodeAlign(sankeyJustify)
    .extent([
      [MARGIN.left, MARGIN.top],
      [width - MARGIN.right, height - MARGIN.bottom],
    ])

  return generator({
    nodes: graphData.nodes.map((node) => ({ ...node })),
    links: graphData.links.map((link) => ({ ...link })),
  })
}

/** Silo nodes hold stored stock — render muted/outlined to read as "in storage". */
function nodeFill(kind: FlowNodeKind) {
  return kind === "silo" ? "var(--muted)" : "var(--foreground)"
}

function SankeyTooltip({ hover }: { hover: SankeyHover | null }) {
  if (!hover) return null

  return (
    <div
      className="pointer-events-none absolute z-10 w-auto min-w-52 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md"
      style={{ left: hover.x, top: hover.y - 8 }}
    >
      {hover.type === "link" ? (
        <>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">Flow</p>
            <p className="text-xs leading-snug text-muted-foreground">
              {hover.sourceNombre} → {hover.targetNombre}
            </p>
          </div>
          <dl className="mt-2 flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Commodity</dt>
              <dd className="flex items-center gap-1.5 font-medium">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: COMMODITY_FLOW_COLORS[hover.commodity] }}
                />
                {COMMODITY_META[hover.commodity].label}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Volume</dt>
              <dd className="font-medium tabular-nums">{formatTons(hover.tons)}</dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{hover.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {STAGE_META[hover.kind].label}
              {hover.kind === "silo" ? " · storage" : null}
            </p>
          </div>
          <dl className="mt-2 flex flex-col gap-1.5 text-sm">
            {hover.stock ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Stored</dt>
                  <dd className="font-medium tabular-nums">
                    {formatTons(hover.stock.stored)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Forwarded</dt>
                  <dd className="font-medium tabular-nums">
                    {formatTons(hover.stock.forwarded)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">In stock</dt>
                  <dd className="font-medium tabular-nums">
                    {formatTons(hover.stock.remaining)}
                  </dd>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-medium tabular-nums">{formatTons(hover.tons)}</dd>
              </div>
            )}
            {hover.porCommodity && hover.porCommodity.length > 0 ? (
              <>
                <div className="border-t border-border pt-1.5" aria-hidden />
                {hover.porCommodity.map(({ commodity, tons }) => (
                  <div
                    key={commodity}
                    className="flex items-center justify-between gap-4"
                  >
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: COMMODITY_FLOW_COLORS[commodity] }}
                      />
                      {COMMODITY_META[commodity].label}
                    </dt>
                    <dd className="font-medium tabular-nums">{formatTons(tons)}</dd>
                  </div>
                ))}
              </>
            ) : null}
          </dl>
        </>
      )}
    </div>
  )
}

function SankeySvg({
  width,
  height,
  data,
  ariaLabel = "Sankey diagram of commodity custody flow",
}: {
  width: number
  height: number
  data: FlowSankeyGraph
  ariaLabel?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hover, setHover] = React.useState<SankeyHover | null>(null)

  const graph = React.useMemo(() => {
    if (data.nodes.length === 0 || data.links.length === 0) return null
    try {
      return buildSankeyLayout(data, width, height)
    } catch {
      return null
    }
  }, [data, width, height])
  const linkPath = sankeyLinkHorizontal<LayoutNode, LayoutLink>()

  const clearCloseTimeout = React.useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const scheduleClose = React.useCallback(() => {
    clearCloseTimeout()
    closeTimeoutRef.current = setTimeout(() => setHover(null), 80)
  }, [clearCloseTimeout])

  React.useEffect(() => () => clearCloseTimeout(), [clearCloseTimeout])

  const pointerPosition = React.useCallback((event: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }, [])

  const showLinkHover = React.useCallback(
    (
      event: React.MouseEvent,
      link: LayoutLink,
      source: LayoutNode,
      target: LayoutNode
    ) => {
      const pos = pointerPosition(event)
      if (!pos) return
      clearCloseTimeout()
      setHover({
        type: "link",
        ...pos,
        sourceNombre: source.nombre,
        targetNombre: target.nombre,
        commodity: link.commodity,
        tons: link.value ?? 0,
      })
    },
    [clearCloseTimeout, pointerPosition]
  )

  const showNodeHover = React.useCallback(
    (event: React.MouseEvent, node: LayoutNode) => {
      const pos = pointerPosition(event)
      if (!pos || !graph) return
      clearCloseTimeout()
      const porCommodity =
        node.kind === "production"
          ? getOutgoingPorCommodity(node.id, graph.links)
          : getIncomingPorCommodity(node.id, graph.links)

      let stock: { stored: number; forwarded: number; remaining: number } | undefined
      if (node.kind === "silo") {
        const stored = (node.targetLinks ?? []).reduce(
          (sum, link) => sum + (link.value ?? 0),
          0
        )
        const forwarded = (node.sourceLinks ?? []).reduce(
          (sum, link) => sum + (link.value ?? 0),
          0
        )
        stock = { stored, forwarded, remaining: Math.max(0, stored - forwarded) }
      }

      setHover({
        type: "node",
        ...pos,
        nombre: node.nombre,
        kind: node.kind,
        tons: node.value ?? 0,
        porCommodity,
        stock,
      })
    },
    [clearCloseTimeout, pointerPosition, graph]
  )

  const moveHover = React.useCallback(
    (event: React.MouseEvent) => {
      const pos = pointerPosition(event)
      if (!pos) return
      setHover((current) => (current ? { ...current, ...pos } : null))
    },
    [pointerPosition]
  )

  if (!graph || width <= 0 || height <= 0) return null
  if (graph.nodes.length === 0 || graph.links.length === 0) return null

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-visible">
      <SankeyTooltip hover={hover} />
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        role="img"
        aria-label={ariaLabel}
      >
        <g fill="none" strokeOpacity={0.45}>
          {graph.links.map((link, index) => {
            const source = link.source as LayoutNode
            const target = link.target as LayoutNode
            const stroke = COMMODITY_FLOW_COLORS[link.commodity] ?? "var(--chart-1)"
            const path = linkPath(link)
            if (!path) return null
            const hitWidth = Math.max(16, link.width ?? 0)

            return (
              <g key={`link-${index}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={hitWidth}
                  className="cursor-default"
                  onMouseEnter={(event) => showLinkHover(event, link, source, target)}
                  onMouseMove={moveHover}
                  onMouseLeave={scheduleClose}
                />
                <path
                  d={path}
                  stroke={stroke}
                  strokeWidth={Math.max(1, link.width ?? 0)}
                  pointerEvents="none"
                />
              </g>
            )
          })}
        </g>

        {graph.nodes.map((node) => {
          const x0 = node.x0 ?? 0
          const x1 = node.x1 ?? 0
          const y0 = node.y0 ?? 0
          const y1 = node.y1 ?? 0
          const isSilo = node.kind === "silo"
          const labelY = (y0 + y1) / 2
          const siloStock = isSilo
            ? Math.max(
                0,
                (node.targetLinks ?? []).reduce(
                  (sum, link) => sum + (link.value ?? 0),
                  0
                ) -
                  (node.sourceLinks ?? []).reduce(
                    (sum, link) => sum + (link.value ?? 0),
                    0
                  )
              )
            : 0

          return (
            <g key={node.id}>
              <rect
                x={x0}
                y={y0}
                width={Math.max(0, x1 - x0)}
                height={Math.max(0, y1 - y0)}
                fill={nodeFill(node.kind)}
                fillOpacity={isSilo ? 0.6 : 0.85}
                stroke={isSilo ? "var(--border)" : "none"}
                strokeWidth={isSilo ? 1 : 0}
                rx={3}
                className="cursor-default"
                onMouseEnter={(event) => showNodeHover(event, node)}
                onMouseMove={moveHover}
                onMouseLeave={scheduleClose}
              />
              <text
                x={x1 + LABEL_GAP}
                y={labelY}
                dy="0.35em"
                textAnchor="start"
                className="pointer-events-none fill-foreground text-[11px]"
              >
                {node.nombre}
              </text>
              <text
                x={x1 + LABEL_GAP}
                y={labelY}
                dy="1.35em"
                textAnchor="start"
                className="pointer-events-none fill-muted-foreground text-[10px]"
              >
                {isSilo
                  ? `In stock: ${formatTons(siloStock)}`
                  : formatTons(node.value ?? 0)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function SankeyFlowChart({
  data,
  className,
  ariaLabel,
}: {
  data: FlowSankeyGraph
  className?: string
  ariaLabel?: string
}) {
  const { ref, width, height } = useContainerSize()

  return (
    <div ref={ref} className={cn("w-full overflow-visible", className)}>
      <SankeySvg
        width={width}
        height={height}
        data={data}
        ariaLabel={ariaLabel}
      />
    </div>
  )
}
