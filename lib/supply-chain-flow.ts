import type { CommodityType, StageType } from "@/lib/types"

/**
 * Demo dataset for the "Commodity flow" Sankey on /estadisticas.
 *
 * Models the custody chain of the traceability demo with illustrative tonnage
 * so the structure is legible:
 *
 *   Production site (farms) -> Truck -> Silo (aggregates + retains stock)
 *     -> Railway -> Origin port -> Vessel -> Destination port (buyers)
 *
 * Links are colored by commodity (coffee / cacao). The silo keeps part of its
 * inflow as stock, rendered as the gap between what enters and what leaves —
 * mirroring how an aggregation point holds inventory before it ships out.
 *
 * Shaped to mirror the existing domain (StageType, CommodityType, tons) so it
 * can later be swapped for real store data with no chart changes.
 */

export type FlowNodeKind = StageType

/** Left-to-right order in the Sankey diagram (matches account.order). */
export const FLOW_STAGE_ORDER: readonly FlowNodeKind[] = [
  "production",
  "truck",
  "silo",
  "railway",
  "origin-port",
  "ship",
  "destination-port",
] as const

/** Collapse hidden stages from the sink outward so intermediates still balance. */
const FLOW_STAGE_COLLAPSE_ORDER: readonly FlowNodeKind[] = [
  "destination-port",
  "ship",
  "origin-port",
  "railway",
  "silo",
  "truck",
  "production",
] as const

/** SVG-friendly flow colors — neutral theme tokens, not commodity-tinted. */
export const COMMODITY_FLOW_COLORS: Record<CommodityType, string> = {
  coffee: "var(--chart-2)",
  cacao: "var(--chart-3)",
}

export type FlowSankeyNode = {
  /** Stable id used by d3-sankey (nodeId). */
  id: string
  /** Display label. */
  nombre: string
  kind: FlowNodeKind
  /** Production sites carry the commodity they grow (used by the origin filter). */
  commodity?: CommodityType
}

export type FlowSankeyLink = {
  source: string
  target: string
  value: number
  commodity: CommodityType
}

export type FlowSankeyGraph = {
  nodes: FlowSankeyNode[]
  links: FlowSankeyLink[]
}

export type SupplyFlowData = {
  nodes: FlowSankeyNode[]
  links: FlowSankeyLink[]
}

export const supplyFlowDemo: SupplyFlowData = {
  nodes: [
    // Production sites (fan-in)
    { id: "prod_huila", nombre: "Huila Cooperative", kind: "production", commodity: "coffee" },
    { id: "prod_narino", nombre: "Nariño Estate", kind: "production", commodity: "coffee" },
    { id: "prod_tumaco", nombre: "Tumaco Collective", kind: "production", commodity: "cacao" },
    { id: "prod_santander", nombre: "Santander Growers", kind: "production", commodity: "cacao" },
    // Linear middle of the chain
    { id: "truck_andes", nombre: "Andes Freight", kind: "truck" },
    { id: "silo_bv", nombre: "Buenaventura Silo", kind: "silo" },
    { id: "rail_pacific", nombre: "Pacific Rail", kind: "railway" },
    { id: "oport_bv", nombre: "Buenaventura Terminal", kind: "origin-port" },
    { id: "ship_bluewater", nombre: "Bluewater Vessel", kind: "ship" },
    // Destination ports / buyers (fan-out)
    { id: "dport_rotterdam", nombre: "Rotterdam Terminal", kind: "destination-port" },
    { id: "dport_hamburg", nombre: "Hamburg Terminal", kind: "destination-port" },
    { id: "dport_antwerp", nombre: "Antwerp Terminal", kind: "destination-port" },
  ],
  links: [
    // Production -> Truck (coffee 21,000 t · cacao 14,000 t)
    { source: "prod_huila", target: "truck_andes", value: 12_000, commodity: "coffee" },
    { source: "prod_narino", target: "truck_andes", value: 9_000, commodity: "coffee" },
    { source: "prod_tumaco", target: "truck_andes", value: 8_000, commodity: "cacao" },
    { source: "prod_santander", target: "truck_andes", value: 6_000, commodity: "cacao" },
    // Truck -> Silo
    { source: "truck_andes", target: "silo_bv", value: 21_000, commodity: "coffee" },
    { source: "truck_andes", target: "silo_bv", value: 14_000, commodity: "cacao" },
    // Silo -> Railway (silo retains 3,000 t coffee + 3,000 t cacao as stock)
    { source: "silo_bv", target: "rail_pacific", value: 18_000, commodity: "coffee" },
    { source: "silo_bv", target: "rail_pacific", value: 11_000, commodity: "cacao" },
    // Railway -> Origin port
    { source: "rail_pacific", target: "oport_bv", value: 18_000, commodity: "coffee" },
    { source: "rail_pacific", target: "oport_bv", value: 11_000, commodity: "cacao" },
    // Origin port -> Vessel
    { source: "oport_bv", target: "ship_bluewater", value: 18_000, commodity: "coffee" },
    { source: "oport_bv", target: "ship_bluewater", value: 11_000, commodity: "cacao" },
    // Vessel -> Destination ports (coffee 18,000 t · cacao 11,000 t)
    { source: "ship_bluewater", target: "dport_rotterdam", value: 8_000, commodity: "coffee" },
    { source: "ship_bluewater", target: "dport_hamburg", value: 6_000, commodity: "coffee" },
    { source: "ship_bluewater", target: "dport_antwerp", value: 4_000, commodity: "coffee" },
    { source: "ship_bluewater", target: "dport_rotterdam", value: 5_000, commodity: "cacao" },
    { source: "ship_bluewater", target: "dport_hamburg", value: 4_000, commodity: "cacao" },
    { source: "ship_bluewater", target: "dport_antwerp", value: 2_000, commodity: "cacao" },
  ],
}

/** Production sites available for the origin filter, in declaration order. */
export const supplyFlowProductionSites = supplyFlowDemo.nodes.filter(
  (node) => node.kind === "production"
)

export type BuildSupplyFlowOptions = {
  /** When set, only this commodity is included in the flow. */
  commodity?: CommodityType
  /** When set, only this production site's slice is shown, scaled to its share. */
  originId?: string
  /** Stages to omit from the diagram (flow is re-routed across them). */
  hiddenStages?: ReadonlySet<FlowNodeKind>
}

function mergeLink(
  links: Map<string, FlowSankeyLink>,
  source: string,
  target: string,
  value: number,
  commodity: CommodityType
) {
  if (value <= 0.0001) return
  const key = `${source}|${target}|${commodity}`
  const existing = links.get(key)
  if (existing) {
    existing.value += value
    return
  }
  links.set(key, { source, target, value, commodity })
}

/** Removes one stage and merges its in/out flows proportionally. */
function collapseStage(
  graph: FlowSankeyGraph,
  kind: FlowNodeKind
): FlowSankeyGraph {
  const hiddenIds = new Set(
    graph.nodes.filter((node) => node.kind === kind).map((node) => node.id)
  )
  if (hiddenIds.size === 0) return graph

  const remainingNodes = graph.nodes.filter((node) => !hiddenIds.has(node.id))
  const remainingLinks = graph.links.filter(
    (link) => !hiddenIds.has(link.source) && !hiddenIds.has(link.target)
  )
  const merged = new Map<string, FlowSankeyLink>()

  for (const hiddenId of hiddenIds) {
    const incoming = graph.links.filter((link) => link.target === hiddenId)
    const outgoing = graph.links.filter((link) => link.source === hiddenId)
    const totalIn = incoming.reduce((sum, link) => sum + link.value, 0)
    if (totalIn <= 0.0001) continue

    for (const inLink of incoming) {
      for (const outLink of outgoing) {
        if (inLink.commodity !== outLink.commodity) continue
        const value = inLink.value * (outLink.value / totalIn)
        mergeLink(merged, inLink.source, outLink.target, value, inLink.commodity)
      }
    }
  }

  return {
    nodes: remainingNodes,
    links: [...remainingLinks, ...merged.values()],
  }
}

function applyHiddenStages(
  graph: FlowSankeyGraph,
  hiddenStages: ReadonlySet<FlowNodeKind>
): FlowSankeyGraph {
  if (hiddenStages.size === 0) return graph
  let result = graph
  for (const kind of FLOW_STAGE_COLLAPSE_ORDER) {
    if (hiddenStages.has(kind)) {
      result = collapseStage(result, kind)
    }
  }
  return result
}

/**
 * Builds the Sankey graph (nodes + links) from the structured data, applying
 * the commodity / origin filters and any hidden stages.
 *
 * The origin filter keeps inflow == outflow by scaling the whole commodity
 * stream to the selected site's share of that commodity's production, and
 * showing only that site's first hop at full value.
 */
export function buildSupplyFlowSankey(
  data: SupplyFlowData = supplyFlowDemo,
  options: BuildSupplyFlowOptions = {}
): FlowSankeyGraph {
  const { commodity, originId, hiddenStages } = options
  const productionIds = new Set(
    data.nodes.filter((node) => node.kind === "production").map((node) => node.id)
  )

  let activeCommodity = commodity
  let scale = 1
  let keepOriginId: string | null = null

  if (originId) {
    const origin = data.nodes.find(
      (node) => node.id === originId && node.kind === "production"
    )
    if (origin?.commodity) {
      activeCommodity = origin.commodity
      const originQty = data.links
        .filter((link) => link.source === originId)
        .reduce((sum, link) => sum + link.value, 0)
      const commodityProduction = data.links
        .filter(
          (link) =>
            productionIds.has(link.source) && link.commodity === origin.commodity
        )
        .reduce((sum, link) => sum + link.value, 0)
      scale = commodityProduction > 0 ? originQty / commodityProduction : 0
      keepOriginId = originId
    }
  }

  let links = data.links.map((link) => ({ ...link }))

  if (activeCommodity) {
    links = links.filter((link) => link.commodity === activeCommodity)
  }

  if (keepOriginId) {
    // Keep only the selected site's first hop, drop other production sources,
    // and scale every downstream link to the site's share.
    links = links
      .filter(
        (link) => !productionIds.has(link.source) || link.source === keepOriginId
      )
      .map((link) =>
        productionIds.has(link.source)
          ? link
          : { ...link, value: link.value * scale }
      )
  }

  links = links.filter((link) => link.value > 0.0001)

  const usedIds = new Set<string>()
  for (const link of links) {
    usedIds.add(link.source)
    usedIds.add(link.target)
  }
  const nodes = data.nodes
    .filter((node) => usedIds.has(node.id))
    .map((node) => ({ ...node }))

  const graph: FlowSankeyGraph = { nodes, links }

  if (hiddenStages && hiddenStages.size > 0) {
    return applyHiddenStages(graph, hiddenStages)
  }
  return graph
}
