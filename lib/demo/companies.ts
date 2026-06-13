export type CompanyRole =
  | "producer"
  | "truck-logistics"
  | "storage"
  | "railway-logistics"
  | "origin-port"
  | "ship-operator"
  | "destination-port"
  | "verifier"
  | "non-involved"

export type Company = {
  id: string
  name: string
  role: CompanyRole
}

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  producer: "Origin producer",
  "truck-logistics": "Truck logistics",
  storage: "Storage operator",
  "railway-logistics": "Rail logistics",
  "origin-port": "Origin port operator",
  "ship-operator": "Ship operator",
  "destination-port": "Destination port operator",
  verifier: "Independent verifier",
  "non-involved": "Non-involved company",
}

export const DEMO_COMPANIES: Company[] = [
  {
    id: "origin-cooperative",
    name: "Origin Cooperative",
    role: "producer",
  },
  {
    id: "andes-freight",
    name: "Andes Freight Logistics",
    role: "truck-logistics",
  },
  {
    id: "silo-storage",
    name: "Silo Storage Co.",
    role: "storage",
  },
  {
    id: "pacific-rail",
    name: "Pacific Rail Logistics",
    role: "railway-logistics",
  },
  {
    id: "buenaventura-port",
    name: "Buenaventura Port Terminal",
    role: "origin-port",
  },
  {
    id: "bluewater-shipping",
    name: "Bluewater Logistics",
    role: "ship-operator",
  },
  {
    id: "rotterdam-port",
    name: "Rotterdam Port Terminal",
    role: "destination-port",
  },
  {
    id: "certchain-verifier",
    name: "CertChain Verifier",
    role: "verifier",
  },
  {
    id: "atlas-commodities",
    name: "Atlas Commodities Trading",
    role: "non-involved",
  },
]

export function companyById(id: string): Company | undefined {
  return DEMO_COMPANIES.find((company) => company.id === id)
}
