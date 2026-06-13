import type {
  Account,
  Asset,
  Certification,
  CommodityType,
  Rating,
  Transfer,
} from "@/lib/types"

export const SEED_ACCOUNTS: Account[] = [
  {
    id: "campo",
    name: "Field Company",
    stageType: "campo",
    order: 0,
    location: "Pergamino, Buenos Aires",
    operator: "Field Company",
  },
  {
    id: "transporte-1",
    name: "Transport Company",
    stageType: "transporte",
    order: 1,
    operator: "Transport Company",
  },
  {
    id: "silo",
    name: "Silo Company",
    stageType: "silo",
    order: 2,
    location: "Rosario, Santa Fe",
    operator: "Silo Company",
  },
  {
    id: "transporte-2",
    name: "Transport Company",
    stageType: "transporte",
    order: 3,
    operator: "Transport Company",
  },
  {
    id: "puerto",
    name: "Port Company",
    stageType: "puerto",
    order: 4,
    location: "San Lorenzo Port",
    operator: "Port Company",
  },
  {
    id: "transporte-3",
    name: "Transport Company",
    stageType: "transporte",
    order: 5,
    operator: "Transport Company",
  },
  {
    id: "planta",
    name: "Processing Plant Company",
    stageType: "planta",
    order: 6,
    location: "San Lorenzo, Santa Fe",
    operator: "Processing Plant Company",
  },
]

const COMMODITIES: CommodityType[] = ["soybean", "wheat", "corn"]

const CERTIFICATION_SETS: Certification[][] = [
  ["non-gmo", "deforestation-free"],
  ["non-gmo"],
  ["deforestation-free"],
  ["non-gmo", "deforestation-free"],
]

const RATINGS: Rating[] = ["A", "B", "C"]

const ASSET_COUNTS_BY_ACCOUNT: Record<string, number> = {
  campo: 10,
  "transporte-1": 6,
  silo: 12,
  "transporte-2": 4,
  puerto: 11,
  "transporte-3": 5,
  planta: 8,
}

function seedQuantity(accountOrder: number, index: number): number {
  const raw = 12_000 + ((accountOrder * 5_173 + index * 2_891) % 40_001)
  return Math.round(raw / 50) * 50
}

function buildSeedAssets(): Asset[] {
  let id = 1

  return SEED_ACCOUNTS.flatMap((account) => {
    const count = ASSET_COUNTS_BY_ACCOUNT[account.id] ?? 6

    return Array.from({ length: count }, (_, index) => ({
      id: `a${id++}`,
      accountId: account.id,
      commodity: COMMODITIES[(account.order + index) % COMMODITIES.length],
      certifications:
        CERTIFICATION_SETS[(account.order + index) % CERTIFICATION_SETS.length],
      rating: RATINGS[(account.order + index) % RATINGS.length],
      quantity: seedQuantity(account.order, index),
      unit: "tons" as const,
    }))
  })
}

export const SEED_ASSETS = buildSeedAssets()

export const SEED_TRANSFERS: Transfer[] = [
  {
    id: "t1",
    fromAccountId: "campo",
    toAccountId: "transporte-1",
    commodity: "soybean",
    certifications: ["non-gmo", "deforestation-free"],
    rating: "A",
    quantity: 12_500,
    unit: "tons",
    occurredAt: "2026-06-10T14:30:00.000Z",
  },
  {
    id: "t2",
    fromAccountId: "transporte-1",
    toAccountId: "silo",
    commodity: "soybean",
    certifications: ["non-gmo", "deforestation-free"],
    rating: "A",
    quantity: 12_500,
    unit: "tons",
    occurredAt: "2026-06-10T18:45:00.000Z",
  },
  {
    id: "t3",
    fromAccountId: "campo",
    toAccountId: "transporte-1",
    commodity: "wheat",
    certifications: ["deforestation-free"],
    rating: "B",
    quantity: 8_200,
    unit: "tons",
    occurredAt: "2026-06-09T09:15:00.000Z",
  },
  {
    id: "t4",
    fromAccountId: "silo",
    toAccountId: "transporte-2",
    commodity: "corn",
    certifications: ["non-gmo"],
    rating: "A",
    quantity: 15_000,
    unit: "tons",
    occurredAt: "2026-06-08T11:00:00.000Z",
  },
  {
    id: "t5",
    fromAccountId: "transporte-2",
    toAccountId: "puerto",
    commodity: "corn",
    certifications: ["non-gmo"],
    rating: "A",
    quantity: 15_000,
    unit: "tons",
    occurredAt: "2026-06-08T16:20:00.000Z",
  },
  {
    id: "t6",
    fromAccountId: "puerto",
    toAccountId: "transporte-3",
    commodity: "soybean",
    certifications: ["non-gmo"],
    rating: "B",
    quantity: 22_400,
    unit: "tons",
    occurredAt: "2026-06-07T08:30:00.000Z",
  },
  {
    id: "t7",
    fromAccountId: "transporte-3",
    toAccountId: "planta",
    commodity: "soybean",
    certifications: ["non-gmo"],
    rating: "B",
    quantity: 22_400,
    unit: "tons",
    occurredAt: "2026-06-07T13:10:00.000Z",
  },
  {
    id: "t8",
    fromAccountId: "silo",
    toAccountId: "transporte-2",
    commodity: "wheat",
    certifications: ["deforestation-free"],
    rating: "C",
    quantity: 6_750,
    unit: "tons",
    occurredAt: "2026-06-06T10:45:00.000Z",
  },
]

export const DEFAULT_SELECTED_ACCOUNT_ID = SEED_ACCOUNTS[0]?.id ?? "campo"
