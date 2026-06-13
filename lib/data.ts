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
    id: "production-site",
    name: "Origin Cooperative",
    stageType: "production",
    order: 0,
    location: "Huila, Colombia",
    operator: "Origin Cooperative",
  },
  {
    id: "truck-transport",
    name: "Truck Transport Co.",
    stageType: "truck",
    order: 1,
    operator: "Truck Transport Co.",
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
    name: "Railway Transport Co.",
    stageType: "railway",
    order: 3,
    operator: "Railway Transport Co.",
  },
  {
    id: "origin-port",
    name: "Origin Port Terminal",
    stageType: "origin-port",
    order: 4,
    location: "Buenaventura Port",
    operator: "Origin Port Terminal",
  },
  {
    id: "ship",
    name: "Ocean Vessel",
    stageType: "ship",
    order: 5,
    operator: "Bluewater Shipping",
  },
  {
    id: "destination-port",
    name: "Destination Port Terminal",
    stageType: "destination-port",
    order: 6,
    location: "Rotterdam Port",
    operator: "Destination Port Terminal",
  },
]

const COMMODITIES: CommodityType[] = ["coffee", "cacao"]

const CERTIFICATION_SETS: Certification[][] = [
  ["non-gmo", "deforestation-free"],
  ["non-gmo"],
  ["deforestation-free"],
  ["non-gmo", "deforestation-free"],
]

const RATINGS: Rating[] = ["A", "B", "C"]

const ASSET_COUNTS_BY_ACCOUNT: Record<string, number> = {
  "production-site": 8,
  "truck-transport": 6,
  silo: 12,
  "railway-transport": 5,
  "origin-port": 7,
  ship: 4,
  "destination-port": 6,
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
    fromAccountId: "production-site",
    toAccountId: "truck-transport",
    commodity: "coffee",
    certifications: ["non-gmo", "deforestation-free"],
    rating: "A",
    quantity: 12_500,
    unit: "tons",
    occurredAt: "2026-06-10T14:30:00.000Z",
    attachments: [
      {
        id: "att-seed-1",
        name: "origin-lot-certificate.pdf",
        mimeType: "application/pdf",
        size: 248_320,
        hash: "0x8f14e45fceea167a5a36dedd4bea2543cf233c5390bbc13e57da6b5305d7c7e",
      },
    ],
  },
  {
    id: "t2",
    fromAccountId: "truck-transport",
    toAccountId: "silo",
    commodity: "coffee",
    certifications: ["non-gmo", "deforestation-free"],
    rating: "A",
    quantity: 12_500,
    unit: "tons",
    occurredAt: "2026-06-10T18:45:00.000Z",
    attachments: [
      {
        id: "att-seed-2",
        name: "transport-sheet-truck-4471.pdf",
        mimeType: "application/pdf",
        size: 182_944,
        hash: "0x2c26b46b68ffc68ff99b453c1d304134e77a568a3d7726ff8067c93a526ee",
      },
      {
        id: "att-seed-3",
        name: "weighbridge-receipt.jpg",
        mimeType: "image/jpeg",
        size: 94_208,
        hash: "0xef2d127de37b942baad06145e54baf7a52695a86",
      },
    ],
  },
  {
    id: "t3",
    fromAccountId: "production-site",
    toAccountId: "truck-transport",
    commodity: "cacao",
    certifications: ["deforestation-free"],
    rating: "B",
    quantity: 8_200,
    unit: "tons",
    occurredAt: "2026-06-09T09:15:00.000Z",
  },
  {
    id: "t4",
    fromAccountId: "silo",
    toAccountId: "railway-transport",
    commodity: "coffee",
    certifications: ["non-gmo"],
    rating: "A",
    quantity: 15_000,
    unit: "tons",
    occurredAt: "2026-06-08T11:00:00.000Z",
  },
  {
    id: "t5",
    fromAccountId: "railway-transport",
    toAccountId: "origin-port",
    commodity: "coffee",
    certifications: ["non-gmo"],
    rating: "A",
    quantity: 15_000,
    unit: "tons",
    occurredAt: "2026-06-08T16:20:00.000Z",
  },
  {
    id: "t6",
    fromAccountId: "origin-port",
    toAccountId: "ship",
    commodity: "cacao",
    certifications: ["non-gmo"],
    rating: "B",
    quantity: 22_400,
    unit: "tons",
    occurredAt: "2026-06-07T08:30:00.000Z",
  },
  {
    id: "t7",
    fromAccountId: "ship",
    toAccountId: "destination-port",
    commodity: "cacao",
    certifications: ["non-gmo"],
    rating: "B",
    quantity: 22_400,
    unit: "tons",
    occurredAt: "2026-06-07T13:10:00.000Z",
  },
  {
    id: "t8",
    fromAccountId: "silo",
    toAccountId: "railway-transport",
    commodity: "cacao",
    certifications: ["deforestation-free"],
    rating: "C",
    quantity: 6_750,
    unit: "tons",
    occurredAt: "2026-06-06T10:45:00.000Z",
  },
]

export const DEFAULT_SELECTED_ACCOUNT_ID = SEED_ACCOUNTS[0]?.id ?? "production-site"
