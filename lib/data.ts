import type {
  Account,
  Asset,
  Certification,
  CommodityType,
  Company,
  Rating,
  Transfer,
} from "@/lib/types"

// ── Companies — one per supply-chain stage ────────────────────────────────────

export const SEED_COMPANIES: Company[] = [
  {
    id: "company-production",
    name: "Finca Verde Cooperative",
    stageType: "production",
    location: "Huila & Nariño, Colombia",
  },
  {
    id: "company-truck",
    name: "Andino Transport Group",
    stageType: "truck",
    location: "Colombia",
  },
  {
    id: "company-silo",
    name: "Silo Storage Co.",
    stageType: "silo",
    location: "Cali, Colombia",
  },
  {
    id: "company-railway",
    name: "Pacific Rail Logistics",
    stageType: "railway",
    location: "Colombia",
  },
  {
    id: "company-origin-port",
    name: "Buenaventura Port Terminal",
    stageType: "origin-port",
    location: "Buenaventura, Colombia",
  },
  {
    id: "company-ship",
    name: "Bluewater Shipping",
    stageType: "ship",
  },
  {
    id: "company-dest",
    name: "European Receiving Ports",
    stageType: "destination-port",
    location: "Europe",
  },
]

// ── Accounts ──────────────────────────────────────────────────────────────────
//
// Snapshot volumes:
//   Production lots  → ~400 t harvest, partially shipped, remainder shown
//   Trucks           → 29–31 t capacity when loaded
//   Silos            → 120–200 t capacity
//   Railway trains   → 480–540 t per consist
//   Port terminals   → 380–500 t accumulated
//   Vessels          → ~2 000 t capacity
//   Destination      → accumulated received tonnage

export const SEED_ACCOUNTS: Account[] = [
  // ── Production – 10 field lots ──────────────────────────────────────────────
  { id: "lot-01", companyId: "company-production", name: "Lot Huila A-1",  stageType: "production", order: 1,  location: "Huila North, Colombia" },
  { id: "lot-02", companyId: "company-production", name: "Lot Huila A-2",  stageType: "production", order: 2,  location: "Huila North, Colombia" },
  { id: "lot-03", companyId: "company-production", name: "Lot Huila B-1",  stageType: "production", order: 3,  location: "Huila South, Colombia" },
  { id: "lot-04", companyId: "company-production", name: "Lot Huila B-2",  stageType: "production", order: 4,  location: "Huila South, Colombia" },
  { id: "lot-05", companyId: "company-production", name: "Lot Nariño A-1", stageType: "production", order: 5,  location: "Nariño, Colombia" },
  { id: "lot-06", companyId: "company-production", name: "Lot Nariño A-2", stageType: "production", order: 6,  location: "Nariño, Colombia" },
  { id: "lot-07", companyId: "company-production", name: "Lot Cauca A-1",  stageType: "production", order: 7,  location: "Cauca Valley, Colombia" },
  { id: "lot-08", companyId: "company-production", name: "Lot Cauca A-2",  stageType: "production", order: 8,  location: "Cauca Valley, Colombia" },
  { id: "lot-09", companyId: "company-production", name: "Lot Tolima A-1", stageType: "production", order: 9,  location: "Tolima, Colombia" },
  { id: "lot-10", companyId: "company-production", name: "Lot Tolima A-2", stageType: "production", order: 10, location: "Tolima, Colombia" },

  // ── Trucks – 35 vehicles ─────────────────────────────────────────────────────
  ...Array.from({ length: 35 }, (_, i): Account => ({
    id: `truck-${String(i + 1).padStart(2, "0")}`,
    companyId: "company-truck",
    name: `ATG Truck ${String(i + 1).padStart(2, "0")}`,
    stageType: "truck",
    order: 100 + i + 1,
  })),

  // ── Silos – 10 facilities ────────────────────────────────────────────────────
  { id: "silo-01", companyId: "company-silo", name: "Cali Silo 01",       stageType: "silo", order: 201, location: "Cali North, Colombia" },
  { id: "silo-02", companyId: "company-silo", name: "Cali Silo 02",       stageType: "silo", order: 202, location: "Cali North, Colombia" },
  { id: "silo-03", companyId: "company-silo", name: "Cali Silo 03",       stageType: "silo", order: 203, location: "Cali South, Colombia" },
  { id: "silo-04", companyId: "company-silo", name: "Cali Silo 04",       stageType: "silo", order: 204, location: "Cali South, Colombia" },
  { id: "silo-05", companyId: "company-silo", name: "Palmira Hub 01",     stageType: "silo", order: 205, location: "Palmira, Colombia" },
  { id: "silo-06", companyId: "company-silo", name: "Palmira Hub 02",     stageType: "silo", order: 206, location: "Palmira, Colombia" },
  { id: "silo-07", companyId: "company-silo", name: "Bventura Dry-1",     stageType: "silo", order: 207, location: "Buenaventura, Colombia" },
  { id: "silo-08", companyId: "company-silo", name: "Bventura Dry-2",     stageType: "silo", order: 208, location: "Buenaventura, Colombia" },
  { id: "silo-09", companyId: "company-silo", name: "Bventura Dry-3",     stageType: "silo", order: 209, location: "Buenaventura, Colombia" },
  { id: "silo-10", companyId: "company-silo", name: "Cartago Reserve",    stageType: "silo", order: 210, location: "Cartago, Colombia" },

  // ── Railway – 5 freight trains ───────────────────────────────────────────────
  { id: "rail-01", companyId: "company-railway", name: "Pacific Train 01", stageType: "railway", order: 301 },
  { id: "rail-02", companyId: "company-railway", name: "Pacific Train 02", stageType: "railway", order: 302 },
  { id: "rail-03", companyId: "company-railway", name: "Pacific Train 03", stageType: "railway", order: 303 },
  { id: "rail-04", companyId: "company-railway", name: "Pacific Train 04", stageType: "railway", order: 304 },
  { id: "rail-05", companyId: "company-railway", name: "Pacific Train 05", stageType: "railway", order: 305 },

  // ── Origin port – 3 terminals ────────────────────────────────────────────────
  { id: "oport-01", companyId: "company-origin-port", name: "Buenaventura Terminal A", stageType: "origin-port", order: 401, location: "Buenaventura Port" },
  { id: "oport-02", companyId: "company-origin-port", name: "Buenaventura Terminal B", stageType: "origin-port", order: 402, location: "Buenaventura Port" },
  { id: "oport-03", companyId: "company-origin-port", name: "Buenaventura Terminal C", stageType: "origin-port", order: 403, location: "Buenaventura Port" },

  // ── Ships – 4 vessels ────────────────────────────────────────────────────────
  { id: "vessel-01", companyId: "company-ship", name: "MV Atlantic Star",     stageType: "ship", order: 501 },
  { id: "vessel-02", companyId: "company-ship", name: "MV Bluewater Harvest", stageType: "ship", order: 502 },
  { id: "vessel-03", companyId: "company-ship", name: "MV Pacific Trader",    stageType: "ship", order: 503 },
  { id: "vessel-04", companyId: "company-ship", name: "MV Santos Express",    stageType: "ship", order: 504 },

  // ── Destination port – 3 terminals ──────────────────────────────────────────
  { id: "dport-01", companyId: "company-dest", name: "Rotterdam Terminal 1", stageType: "destination-port", order: 601, location: "Rotterdam, Netherlands" },
  { id: "dport-02", companyId: "company-dest", name: "Rotterdam Terminal 2", stageType: "destination-port", order: 602, location: "Rotterdam, Netherlands" },
  { id: "dport-03", companyId: "company-dest", name: "Hamburg Terminal",     stageType: "destination-port", order: 603, location: "Hamburg, Germany" },
]

// ── Commodity profiles ────────────────────────────────────────────────────────

const COFFEE_A: Pick<Asset, "commodity" | "certifications" | "rating" | "unit"> = {
  commodity: "coffee",
  certifications: ["non-gmo", "deforestation-free"],
  rating: "A",
  unit: "tons",
}

const COFFEE_B: Pick<Asset, "commodity" | "certifications" | "rating" | "unit"> = {
  commodity: "coffee",
  certifications: ["non-gmo"],
  rating: "B",
  unit: "tons",
}

const CACAO_B: Pick<Asset, "commodity" | "certifications" | "rating" | "unit"> = {
  commodity: "cacao",
  certifications: ["deforestation-free"],
  rating: "B",
  unit: "tons",
}

// ── Assets ────────────────────────────────────────────────────────────────────
//
// Supply-chain snapshot — mid-campaign, two voyages completed, two at sea.
//
// Active lots:
//   lot-01..04 → coffee A remaining after partial shipping
//   lot-06, lot-08 → cacao B remaining
//   lot-09 → coffee B remaining
//   lot-03, lot-05, lot-07, lot-10 → fully cleared
//
// Trucks 01–06 are currently loaded; trucks 07–35 are empty / returning.
//
// Silos 01–08 are accumulating new batches from recent truck deliveries.
// Silos 09–10 are empty (between batches).
//
// Rail-01 carries coffee A, rail-02 carries cacao B (both heading to port).
// Rail-03..05 are empty.
//
// oport-01: coffee A accumulated; oport-02: cacao B accumulated; oport-03: empty.
//
// vessel-03: at sea with 2 100 t coffee B (loaded May 28)
// vessel-04: at sea with 1 800 t coffee A (loaded May 30)
// vessel-01, vessel-02: completed voyages, now empty / returning
//
// dport-01: received 2 000 t coffee A from vessel-01 (May 15)
// dport-02: received 1 950 t cacao B from vessel-02 (May 28)
// dport-03: empty
//
// IDs prefixed with "h-" are historical ghost assets (already consumed/delivered).
// They appear in sourceAssetIds to maintain full provenance but are not in
// SEED_ASSETS because they no longer represent an active custody position.

export const SEED_ASSETS: Asset[] = [
  // ── Production (remaining balance at each active lot) ─────────────────────

  // lot-01: harvested 400 t; ~250 t shipped so far; 150 t remaining
  { id: "lot-01-cofA", accountId: "lot-01", ...COFFEE_A, quantity: 150 },
  // lot-02: harvested 390 t; ~310 t shipped; 80 t remaining
  { id: "lot-02-cofA", accountId: "lot-02", ...COFFEE_A, quantity: 80 },
  // lot-04: harvested 415 t; ~295 t shipped; 120 t remaining
  { id: "lot-04-cofA", accountId: "lot-04", ...COFFEE_A, quantity: 120 },
  // lot-06: harvested 400 t (cacao); ~240 t shipped; 160 t remaining
  { id: "lot-06-cacB", accountId: "lot-06", ...CACAO_B, quantity: 160 },
  // lot-08: harvested 385 t (cacao); ~295 t shipped; 90 t remaining
  { id: "lot-08-cacB", accountId: "lot-08", ...CACAO_B, quantity: 90 },
  // lot-09: harvested 410 t (coffee B); ~280 t shipped; 130 t remaining
  { id: "lot-09-cofB", accountId: "lot-09", ...COFFEE_B, quantity: 130 },

  // ── Trucks (6 currently loaded; trucks 07–35 are empty) ──────────────────

  { id: "truck-01-cofA", accountId: "truck-01", ...COFFEE_A, quantity: 30, sourceAssetIds: ["lot-01-cofA"] },
  { id: "truck-02-cofA", accountId: "truck-02", ...COFFEE_A, quantity: 29, sourceAssetIds: ["lot-02-cofA"] },
  { id: "truck-03-cofA", accountId: "truck-03", ...COFFEE_A, quantity: 31, sourceAssetIds: ["lot-04-cofA"] },
  { id: "truck-04-cacB", accountId: "truck-04", ...CACAO_B,  quantity: 28, sourceAssetIds: ["lot-06-cacB"] },
  { id: "truck-05-cacB", accountId: "truck-05", ...CACAO_B,  quantity: 31, sourceAssetIds: ["lot-08-cacB"] },
  { id: "truck-06-cofB", accountId: "truck-06", ...COFFEE_B, quantity: 29, sourceAssetIds: ["lot-09-cofB"] },

  // ── Silos (8 active, accumulating current batch from recent truck runs) ───

  // silo-01 received three truck loads of coffee A from lots 01 & 02
  { id: "silo-01-cofA", accountId: "silo-01", ...COFFEE_A, quantity: 180,
    sourceAssetIds: ["h-lot01-t07", "h-lot01-t08", "h-lot02-t09"] },
  // silo-02 received from lots 02 & 04
  { id: "silo-02-cofA", accountId: "silo-02", ...COFFEE_A, quantity: 165,
    sourceAssetIds: ["h-lot02-t10", "h-lot04-t11", "h-lot04-t12"] },
  // silo-03 received from lots 01 & 04
  { id: "silo-03-cofA", accountId: "silo-03", ...COFFEE_A, quantity: 145,
    sourceAssetIds: ["h-lot01-t13", "h-lot04-t14"] },
  // silo-04 received from lots 02 & 01
  { id: "silo-04-cofA", accountId: "silo-04", ...COFFEE_A, quantity: 130,
    sourceAssetIds: ["h-lot02-t15", "h-lot01-t16"] },
  // silo-05 received cacao from lots 06 & 08
  { id: "silo-05-cacB", accountId: "silo-05", ...CACAO_B, quantity: 170,
    sourceAssetIds: ["h-lot06-t17", "h-lot06-t18", "h-lot08-t19"] },
  // silo-06 received cacao from lots 08 & 06
  { id: "silo-06-cacB", accountId: "silo-06", ...CACAO_B, quantity: 150,
    sourceAssetIds: ["h-lot08-t20", "h-lot06-t21"] },
  // silo-07 received coffee B from lot 09
  { id: "silo-07-cofB", accountId: "silo-07", ...COFFEE_B, quantity: 190,
    sourceAssetIds: ["h-lot09-t22", "h-lot09-t23", "h-lot09-t24"] },
  // silo-08 received coffee B from lot 09
  { id: "silo-08-cofB", accountId: "silo-08", ...COFFEE_B, quantity: 140,
    sourceAssetIds: ["h-lot09-t25", "h-lot09-t26"] },

  // ── Railway (2 trains in transit, from previous silo batches) ────────────

  // rail-01: loaded coffee A from silos 01+02+03 (previous silo batch)
  { id: "rail-01-cofA", accountId: "rail-01", ...COFFEE_A, quantity: 510,
    sourceAssetIds: ["h-silo01-r1", "h-silo02-r1", "h-silo03-r1"] },
  // rail-02: loaded cacao B from silos 05+06 (previous silo batch)
  { id: "rail-02-cacB", accountId: "rail-02", ...CACAO_B, quantity: 490,
    sourceAssetIds: ["h-silo05-r2", "h-silo06-r2"] },

  // ── Origin port (accumulating from recent rail deliveries) ────────────────

  // oport-01: coffee A from rail-01 run + earlier rail-03 run
  { id: "oport-01-cofA", accountId: "oport-01", ...COFFEE_A, quantity: 480,
    sourceAssetIds: ["h-rail01-p1", "h-rail03-p1"] },
  // oport-02: cacao B from rail-02 run
  { id: "oport-02-cacB", accountId: "oport-02", ...CACAO_B, quantity: 390,
    sourceAssetIds: ["h-rail02-p2"] },

  // ── Vessels at sea ────────────────────────────────────────────────────────

  // vessel-03 loaded coffee B on May 28; currently at sea
  { id: "vessel-03-cofB", accountId: "vessel-03", ...COFFEE_B, quantity: 2_100,
    sourceAssetIds: ["h-oport03-cofB-run1"] },
  // vessel-04 loaded coffee A on May 30; currently at sea
  { id: "vessel-04-cofA", accountId: "vessel-04", ...COFFEE_A, quantity: 1_800,
    sourceAssetIds: ["h-oport01-cofA-run1"] },

  // ── Destination ports (received cargo from completed voyages) ─────────────

  // dport-01 received 2 000 t coffee A from vessel-01 (May 15)
  { id: "dport-01-cofA", accountId: "dport-01", ...COFFEE_A, quantity: 2_000,
    sourceAssetIds: ["h-vessel01-cofA"] },
  // dport-02 received 1 950 t cacao B from vessel-02 (May 28)
  { id: "dport-02-cacB", accountId: "dport-02", ...CACAO_B, quantity: 1_950,
    sourceAssetIds: ["h-vessel02-cacB"] },
]

// ── Transfers ─────────────────────────────────────────────────────────────────

function t(
  id: string,
  from: string,
  to: string,
  fromAssetId: string,
  toAssetId: string,
  commodity: CommodityType,
  certs: Certification[],
  rating: Rating,
  qty: number,
  date: string,
  attachments?: Transfer["attachments"]
): Transfer {
  return {
    id,
    fromAccountId: from,
    toAccountId: to,
    fromAssetId,
    toAssetId,
    commodity,
    certifications: certs,
    rating,
    quantity: qty,
    unit: "tons",
    occurredAt: date,
    ...(attachments ? { attachments } : {}),
  }
}

// ── Farm → Truck (active pickups, June 12–13) ─────────────────────────────────

const farmToTruck: Transfer[] = [
  t("fa-01", "lot-01", "truck-01", "lot-01-cofA", "truck-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 30, "2026-06-13T08:00:00Z", [
    { id: "att-fa-01", name: "transport-order-lot01.pdf", mimeType: "application/pdf", size: 96_000, hash: "0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4" },
  ]),
  t("fa-02", "lot-02", "truck-02", "lot-02-cofA", "truck-02-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 29, "2026-06-13T09:15:00Z", [
    { id: "att-fa-02", name: "transport-order-lot02.pdf", mimeType: "application/pdf", size: 94_208, hash: "0xb2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5" },
  ]),
  t("fa-03", "lot-04", "truck-03", "lot-04-cofA", "truck-03-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 31, "2026-06-13T10:30:00Z", [
    { id: "att-fa-03", name: "transport-order-lot04.pdf", mimeType: "application/pdf", size: 98_304, hash: "0xc3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6" },
  ]),
  t("fa-04", "lot-06", "truck-04", "lot-06-cacB", "truck-04-cacB", "cacao",  ["deforestation-free"], "B", 28, "2026-06-13T07:45:00Z", [
    { id: "att-fa-04", name: "transport-order-lot06.pdf", mimeType: "application/pdf", size: 91_136, hash: "0xd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1" },
  ]),
  t("fa-05", "lot-08", "truck-05", "lot-08-cacB", "truck-05-cacB", "cacao",  ["deforestation-free"], "B", 31, "2026-06-13T08:30:00Z", [
    { id: "att-fa-05", name: "transport-order-lot08.pdf", mimeType: "application/pdf", size: 95_232, hash: "0xe5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" },
  ]),
  t("fa-06", "lot-09", "truck-06", "lot-09-cofB", "truck-06-cofB", "coffee", ["non-gmo"], "B", 29, "2026-06-12T14:00:00Z", [
    { id: "att-fa-06", name: "transport-order-lot09.pdf", mimeType: "application/pdf", size: 92_160, hash: "0xf6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3" },
  ]),
]

// ── Truck → Silo (recent historical deliveries; ghost fromAssetIds) ───────────

const truckToSilo: Transfer[] = [
  // Three previous truck runs that built up silo-01
  t("ts-01", "truck-07", "silo-01", "h-lot01-t07", "silo-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 60, "2026-06-10T09:00:00Z"),
  t("ts-02", "truck-08", "silo-01", "h-lot01-t08", "silo-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 60, "2026-06-10T13:00:00Z"),
  t("ts-03", "truck-09", "silo-01", "h-lot02-t09", "silo-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 60, "2026-06-11T08:00:00Z"),
  // Two previous truck runs that built up silo-05 (cacao)
  t("ts-04", "truck-17", "silo-05", "h-lot06-t17", "silo-05-cacB", "cacao",  ["deforestation-free"], "B", 58, "2026-06-11T10:00:00Z"),
  t("ts-05", "truck-18", "silo-05", "h-lot06-t18", "silo-05-cacB", "cacao",  ["deforestation-free"], "B", 60, "2026-06-11T14:30:00Z"),
  // Three previous truck runs that built up silo-07 (coffee B)
  t("ts-06", "truck-22", "silo-07", "h-lot09-t22", "silo-07-cofB", "coffee", ["non-gmo"], "B", 64, "2026-06-09T08:00:00Z"),
  t("ts-07", "truck-23", "silo-07", "h-lot09-t23", "silo-07-cofB", "coffee", ["non-gmo"], "B", 63, "2026-06-09T12:00:00Z"),
  t("ts-08", "truck-24", "silo-07", "h-lot09-t24", "silo-07-cofB", "coffee", ["non-gmo"], "B", 63, "2026-06-09T16:00:00Z"),
]

// ── Silo → Rail (historical dispatch; ghost fromAssetIds represent prev batch) ──

const siloToRail: Transfer[] = [
  // Previous silo batches (batch 1) loaded onto rail-01 for coffee A
  t("sr-01", "silo-01", "rail-01", "h-silo01-r1", "rail-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 175, "2026-06-07T06:00:00Z"),
  t("sr-02", "silo-02", "rail-01", "h-silo02-r1", "rail-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 168, "2026-06-07T07:00:00Z"),
  t("sr-03", "silo-03", "rail-01", "h-silo03-r1", "rail-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 167, "2026-06-07T08:00:00Z"),
  // Previous silo batches loaded onto rail-02 for cacao B
  t("sr-04", "silo-05", "rail-02", "h-silo05-r2", "rail-02-cacB", "cacao",  ["deforestation-free"], "B", 248, "2026-06-08T06:30:00Z"),
  t("sr-05", "silo-06", "rail-02", "h-silo06-r2", "rail-02-cacB", "cacao",  ["deforestation-free"], "B", 242, "2026-06-08T07:30:00Z"),
]

// ── Rail → Port (historical arrivals; ghost fromAssetIds) ─────────────────────

const railToPort: Transfer[] = [
  // Earlier rail runs that filled oport-01 with coffee A
  t("rp-01", "rail-01", "oport-01", "h-rail01-p1", "oport-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 320, "2026-06-05T10:00:00Z"),
  t("rp-02", "rail-03", "oport-01", "h-rail03-p1", "oport-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 160, "2026-06-06T08:00:00Z"),
  // Rail run that filled oport-02 with cacao B
  t("rp-03", "rail-02", "oport-02", "h-rail02-p2", "oport-02-cacB", "cacao",  ["deforestation-free"], "B", 390, "2026-06-06T12:00:00Z"),
]

// ── Port → Ship (loadings, bills of lading) ───────────────────────────────────

const portToShip: Transfer[] = [
  // vessel-03 loaded coffee B from oport-03 (previous terminal batch, ghost)
  t("ps-01", "oport-03", "vessel-03", "h-oport03-cofB-run1", "vessel-03-cofB", "coffee", ["non-gmo"], "B", 2_100, "2026-05-28T06:00:00Z", [
    { id: "att-ps-01a", name: "bill-of-lading-BW-5521.pdf",         mimeType: "application/pdf", size: 318_464, hash: "0x3f79bb7b435b05321651daefd374cdc6" },
    { id: "att-ps-01b", name: "phytosanitary-certificate-cofB.pdf", mimeType: "application/pdf", size: 102_400, hash: "0x4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a" },
    { id: "att-ps-01c", name: "fumigation-cert-BW5521.pdf",         mimeType: "application/pdf", size: 78_848,  hash: "0x5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b" },
  ]),
  // vessel-04 loaded coffee A from oport-01 (previous batch, ghost)
  t("ps-02", "oport-01", "vessel-04", "h-oport01-cofA-run1", "vessel-04-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 1_800, "2026-05-30T07:00:00Z", [
    { id: "att-ps-02a", name: "bill-of-lading-BW-5523.pdf",         mimeType: "application/pdf", size: 322_560, hash: "0x6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c" },
    { id: "att-ps-02b", name: "phytosanitary-certificate-cofA.pdf", mimeType: "application/pdf", size: 105_472, hash: "0x7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d" },
    { id: "att-ps-02c", name: "weight-certificate-BW5523.pdf",      mimeType: "application/pdf", size: 81_920,  hash: "0x8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e" },
  ]),
]

// ── Ship → Destination (completed voyages) ────────────────────────────────────

const shipToDest: Transfer[] = [
  // vessel-01 delivered coffee A to Rotterdam (May 15, vessel now empty / returning)
  t("vd-01", "vessel-01", "dport-01", "h-vessel01-cofA", "dport-01-cofA", "coffee", ["non-gmo","deforestation-free"], "A", 2_000, "2026-05-15T08:00:00Z", [
    { id: "att-vd-01a", name: "customs-entry-NL-2026-05-15.pdf",    mimeType: "application/pdf", size: 201_728, hash: "0x9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f" },
    { id: "att-vd-01b", name: "warehouse-receipt-rotterdam-T1.pdf", mimeType: "application/pdf", size: 159_744, hash: "0x0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a" },
    { id: "att-vd-01c", name: "arrival-notice-BW-5501.pdf",         mimeType: "application/pdf", size: 88_064,  hash: "0x1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b" },
  ]),
  // vessel-02 delivered cacao B to Rotterdam T2 (May 28, vessel now empty / returning)
  t("vd-02", "vessel-02", "dport-02", "h-vessel02-cacB", "dport-02-cacB", "cacao",  ["deforestation-free"], "B", 1_950, "2026-05-28T10:00:00Z", [
    { id: "att-vd-02a", name: "customs-entry-NL-2026-05-28.pdf",    mimeType: "application/pdf", size: 196_608, hash: "0x2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c" },
    { id: "att-vd-02b", name: "warehouse-receipt-rotterdam-T2.pdf", mimeType: "application/pdf", size: 163_840, hash: "0x3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d" },
    { id: "att-vd-02c", name: "deforestation-compliance-NL.pdf",    mimeType: "application/pdf", size: 114_688, hash: "0x4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e" },
  ]),
]

export const SEED_TRANSFERS: Transfer[] = [
  ...farmToTruck,
  ...truckToSilo,
  ...siloToRail,
  ...railToPort,
  ...portToShip,
  ...shipToDest,
]

export const DEFAULT_SELECTED_ACCOUNT_ID = "lot-01"
export const DEFAULT_SELECTED_COMPANY_ID = "company-production"
