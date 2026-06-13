import type { Account } from "@/lib/types"

export const SEED_ACCOUNTS: Account[] = [
  {
    id: "production-site",
    name: "Origin Cooperative",
    stageType: "production",
    order: 0,
    location: "Huila, Colombia",
    operator: "Origin Cooperative",
  },
  {
    id: "truck-transport",
    name: "Andes Freight Logistics",
    stageType: "truck",
    order: 1,
    operator: "Andes Freight Logistics",
  },
  {
    id: "silo",
    name: "Silo Storage Co.",
    stageType: "silo",
    order: 2,
    location: "Buenaventura Inland Hub",
    operator: "Silo Storage Co.",
  },
  {
    id: "railway-transport",
    name: "Pacific Rail Logistics",
    stageType: "railway",
    order: 3,
    operator: "Pacific Rail Logistics",
  },
  {
    id: "origin-port",
    name: "Buenaventura Port Terminal",
    stageType: "origin-port",
    order: 4,
    location: "Buenaventura Port",
    operator: "Buenaventura Port Terminal",
  },
  {
    id: "ship",
    name: "Bluewater Logistics",
    stageType: "ship",
    order: 5,
    operator: "Bluewater Shipping",
  },
  {
    id: "destination-port",
    name: "Rotterdam Port Terminal",
    stageType: "destination-port",
    order: 6,
    location: "Rotterdam Port",
    operator: "Rotterdam Port Terminal",
  },
]

export const DEFAULT_SELECTED_ACCOUNT_ID =
  SEED_ACCOUNTS[0]?.id ?? "production-site"
