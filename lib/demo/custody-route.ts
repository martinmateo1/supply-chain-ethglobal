import { DEMO_OPERATIONAL_NODES } from "@/lib/demo/operational-nodes"

/**
 * The configured demo custody route in physical order, derived from the seed
 * operational-node `order` (production → truck → silo → rail → origin-port →
 * ship → destination-port). Route ordering is a single source of truth so the
 * UI never hardcodes party ids.
 */
export const CUSTODY_ROUTE: string[] = [...DEMO_OPERATIONAL_NODES]
  .sort((a, b) => a.order - b.order)
  .map((node) => node.id)

export function custodyRouteIndex(accountId: string): number {
  return CUSTODY_ROUTE.indexOf(accountId)
}

/**
 * The suggested next-hop operational node id for a party along the route, or
 * null at the end of the route or for off-route nodes. The route is a
 * suggestion used to order/highlight destination options — free choice of any
 * destination is still allowed.
 */
export function suggestNextCustodyStep(accountId: string): string | null {
  const index = custodyRouteIndex(accountId)
  if (index < 0 || index >= CUSTODY_ROUTE.length - 1) return null
  return CUSTODY_ROUTE[index + 1] ?? null
}
