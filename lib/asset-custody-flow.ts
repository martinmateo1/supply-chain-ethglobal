import type {
  FlowSankeyGraph,
  FlowSankeyLink,
  FlowSankeyNode,
} from "@/lib/supply-chain-flow"
import type { Account, Asset, StageType, Transfer } from "@/lib/types"

const STAGE_ORDER: StageType[] = [
  "production",
  "truck",
  "silo",
  "railway",
  "origin-port",
  "ship",
  "destination-port",
]

/**
 * Walk backward from the asset through toAssetId links to build a fan-in DAG.
 */
function buildDagFromProvenance(
  asset: Asset,
  transfers: Transfer[],
  accountById: Map<string, Account>
): FlowSankeyGraph | null {
  const nodeIds = new Set<string>()
  const linkMap = new Map<string, FlowSankeyLink>()
  const visitedAssets = new Set<string>()
  const queue = [asset.id]

  while (queue.length > 0) {
    const currentAssetId = queue.shift()
    if (!currentAssetId || visitedAssets.has(currentAssetId)) continue
    visitedAssets.add(currentAssetId)

    const incoming = transfers.filter((tr) => tr.toAssetId === currentAssetId)
    if (incoming.length === 0) continue

    for (const tr of incoming) {
      const from = accountById.get(tr.fromAccountId)
      const to = accountById.get(tr.toAccountId)
      if (!from || !to) continue

      nodeIds.add(tr.fromAccountId)
      nodeIds.add(tr.toAccountId)

      const key = `${tr.fromAccountId}→${tr.toAccountId}`
      const existing = linkMap.get(key)
      linkMap.set(key, {
        source: tr.fromAccountId,
        target: tr.toAccountId,
        value: existing ? existing.value + tr.quantity : tr.quantity,
        commodity: tr.commodity,
      })

      if (!visitedAssets.has(tr.fromAssetId)) {
        queue.push(tr.fromAssetId)
      }
    }
  }

  const nodes: FlowSankeyNode[] = [...nodeIds].flatMap((id) => {
    const acc = accountById.get(id)
    if (!acc) return []
    return [{ id, nombre: acc.name, kind: acc.stageType }]
  })

  const links = [...linkMap.values()]

  if (nodes.length > 1 && links.length > 0) return { nodes, links }
  return null
}

function buildLinearFallback(
  asset: Asset,
  holding: Account,
  accounts: Account[]
): FlowSankeyGraph {
  const holdingStageIdx = STAGE_ORDER.indexOf(holding.stageType)
  if (holdingStageIdx <= 0) return { nodes: [], links: [] }

  const canonicalByStage = new Map<StageType, Account>()
  for (const acc of accounts) {
    const existing = canonicalByStage.get(acc.stageType)
    if (!existing || acc.order < existing.order) {
      canonicalByStage.set(acc.stageType, acc)
    }
  }

  const path: Account[] = []
  for (let i = 0; i <= holdingStageIdx; i++) {
    const stageType = STAGE_ORDER[i]
    if (!stageType) continue

    if (stageType === holding.stageType) {
      path.push(holding)
    } else {
      const canonical = canonicalByStage.get(stageType)
      if (canonical) path.push(canonical)
    }
  }

  const cutStage = holding.stageType === "silo" ? holding : null
  const cutIdx = cutStage ? path.findIndex((a) => a.id === cutStage.id) : -1
  const trimmed = cutIdx >= 0 ? path.slice(0, cutIdx + 1) : path

  if (trimmed.length <= 1) return { nodes: [], links: [] }

  const nodes: FlowSankeyNode[] = trimmed.map((acc) => ({
    id: acc.id,
    nombre: acc.name,
    kind: acc.stageType,
  }))

  const links: FlowSankeyLink[] = trimmed.slice(0, -1).map((acc, i) => ({
    source: acc.id,
    target: trimmed[i + 1]!.id,
    value: asset.quantity,
    commodity: asset.commodity,
  }))

  return { nodes, links }
}

/**
 * Builds a Sankey custody-flow graph for a single asset.
 *
 * Uses backward BFS on fromAssetId/toAssetId transfer links when provenance
 * exists; otherwise infers a linear path through canonical stage accounts.
 */
export function buildAssetCustodyFlow(
  asset: Asset,
  accounts: Account[],
  transfers: Transfer[]
): FlowSankeyGraph {
  const accountById = new Map(accounts.map((a) => [a.id, a]))
  const holding = accountById.get(asset.accountId)
  if (!holding) return { nodes: [], links: [] }

  const dag = buildDagFromProvenance(asset, transfers, accountById)
  if (dag) return dag

  return buildLinearFallback(asset, holding, accounts)
}
