import type { Account } from "@/lib/types"

import { SEED_ACCOUNTS } from "@/lib/seed/accounts"

/** Operational nodes along the demo custody route (maps to legacy Account seed data). */
export type OperationalNode = Pick<
  Account,
  "id" | "name" | "stageType" | "order" | "location" | "operator"
>

export const DEMO_OPERATIONAL_NODES: OperationalNode[] = SEED_ACCOUNTS.map(
  ({ id, name, stageType, order, location, operator }) => ({
    id,
    name,
    stageType,
    order,
    location,
    operator,
  })
)

export function operationalNodeById(id: string): OperationalNode | undefined {
  return DEMO_OPERATIONAL_NODES.find((node) => node.id === id)
}
