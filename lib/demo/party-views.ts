import {
  COMPANY_ROLE_LABELS,
  type CompanyRole,
  companyById,
} from "@/lib/demo/companies"
import { operationalNodeById } from "@/lib/demo/operational-nodes"

export type PartyView = {
  id: string
  companyId: string
  companyRole: CompanyRole
  /** Canton party / operational node id; null for verifier and non-involved views. */
  operationalNodeId: string | null
  order: number
}

export const NON_INVOLVED_PARTY_VIEW_ID = "non-involved-company"
export const VERIFIER_PARTY_VIEW_ID = "certchain-verifier"

export const DEMO_PARTY_VIEWS: PartyView[] = [
  {
    id: "production-site",
    companyId: "origin-cooperative",
    companyRole: "producer",
    operationalNodeId: "production-site",
    order: 0,
  },
  {
    id: "truck-transport",
    companyId: "andes-freight",
    companyRole: "truck-logistics",
    operationalNodeId: "truck-transport",
    order: 1,
  },
  {
    id: "silo",
    companyId: "silo-storage",
    companyRole: "storage",
    operationalNodeId: "silo",
    order: 2,
  },
  {
    id: "railway-transport",
    companyId: "pacific-rail",
    companyRole: "railway-logistics",
    operationalNodeId: "railway-transport",
    order: 3,
  },
  {
    id: "origin-port",
    companyId: "buenaventura-port",
    companyRole: "origin-port",
    operationalNodeId: "origin-port",
    order: 4,
  },
  {
    id: "ship",
    companyId: "bluewater-shipping",
    companyRole: "ship-operator",
    operationalNodeId: "ship",
    order: 5,
  },
  {
    id: "destination-port",
    companyId: "rotterdam-port",
    companyRole: "destination-port",
    operationalNodeId: "destination-port",
    order: 6,
  },
  {
    id: VERIFIER_PARTY_VIEW_ID,
    companyId: "certchain-verifier",
    companyRole: "verifier",
    operationalNodeId: null,
    order: 7,
  },
  {
    id: NON_INVOLVED_PARTY_VIEW_ID,
    companyId: "atlas-commodities",
    companyRole: "non-involved",
    operationalNodeId: null,
    order: 8,
  },
]

export const DEFAULT_PARTY_VIEW_ID = "production-site"

export function partyViewById(id: string): PartyView | undefined {
  return DEMO_PARTY_VIEWS.find((view) => view.id === id)
}

export function partyViewLabel(view: PartyView): string {
  const company = companyById(view.companyId)
  return company?.name ?? view.id
}

export function partyViewRoleLabel(view: PartyView): string {
  return COMPANY_ROLE_LABELS[view.companyRole]
}

export function partyViewNodeLabel(view: PartyView): string | null {
  if (!view.operationalNodeId) return null
  return operationalNodeById(view.operationalNodeId)?.name ?? view.operationalNodeId
}

export function isRoutePartyView(view: PartyView): boolean {
  return view.operationalNodeId !== null
}
