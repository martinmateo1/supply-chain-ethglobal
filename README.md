# Private Commodity Traceability

A supply chain traceability dashboard for certified commodities built at the Bedrock Hackathon. Track coffee beans and cacao as custody moves between private company accounts, logistics operators, storage facilities, port terminals, and vessel assets.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)

---

## What It Does

Private Commodity Traceability lets you follow coffee and cacao lots together across every account in the demo custody flow:

| Stage | Icon | Description |
|---|---|---|
| **Production site** | 🌱 | Farm, cooperative, or certified production site |
| **Truck transport** | 🚛 | Logistics company account moving custody to storage |
| **Silo** | 🏭 | Storage and aggregation point |
| **Railway transport** | 🏗️ | Logistics company account moving bulk outbound inventory |
| **Port terminal** | ⚓ | Port operator account holding and loading inventory |
| **Vessel logistics** | ⚓ | Logistics company account with vessel assets carrying custody |
| **Receiving port terminal** | ⚓ | Port operator account receiving and holding inbound inventory |

Each account holds **assets** (commodity lots) that carry:
- **Commodity** — coffee beans or cacao
- **Certifications** — `NON-GMO` and/or `Deforestation-free`
- **Quality rating** — A / B / C
- **Quantity** in metric tons

Transfers between accounts update the local custody state while preserving the certification chain of custody at every hop.

---

## Features

- **Combined commodity view** — inspect coffee beans and cacao in the same custody flow
- **Account explorer** — browse each company or facility account in the supply chain
- **Asset ledger** — view current holdings per account with commodity icons and certification badges
- **Transfer history** — full audit log of custody transfers between nodes
- **Traceability view** — select any account and see its complete inbound/outbound transfer graph
- **Dark mode** — fully styled for both light and dark themes
- **Responsive layout** — works on desktop and tablet

---

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) component primitives
- [Zustand](https://zustand-demo.pmnd.rs/) for **UI state only** (not custody truth)
- [Daml](https://www.digitalasset.com/developers) / [Canton](https://www.digitalasset.com/developers) — custody source of truth (skeleton in `daml/`)
- [Lucide React](https://lucide.dev/) icons

Optional for later MVP stories (not required for the current UI demo):

- **Supabase** — off-ledger evidence metadata / file references only
- **Privy** — optional wallet or Party View login mapping

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Next.js app and TypeScript tooling |
| pnpm | 9+ | Package manager |
| Daml SDK | 2.9.x (see `daml/daml.yaml`) | Compile contracts, run Daml tests/scripts |

---

## Getting started

### Frontend (UI demo)

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The dashboard currently reads seeded demo state from `lib/store.ts` (Zustand/localStorage). That store is a **demo adapter** — authoritative custody quantities will come from Canton via `lib/ledger/*` and `app/api/ledger/*` in later stories.

### Quality checks

```bash
pnpm lint
pnpm typecheck
```

### Daml / Canton (ledger skeleton)

Install the [Daml SDK](https://docs.daml.com/getting-started/installation.html), then from the repo root:

```bash
cd daml
daml build          # compile Commodity.* templates
daml test           # run daml/Test/TraceabilityTest.daml (placeholder until Epic 3)
daml script --dar .daml/dist/commodity-traceability-0.0.1.dar --script-name Scripts.SetupDemo:setupDemo
```

**Canton LocalNet / DevNet:** not wired in this story. When a ledger runtime is available, set:

```env
CANTON_LEDGER_HOST=http://localhost:6865
CANTON_LEDGER_ID=<your-ledger-id>
```

Until then, ledger integration modules throw `LEDGER_NOT_CONFIGURED` and the UI continues to use mock data.

### Generated TypeScript bindings

After `daml build` succeeds:

```bash
pnpm run generate:daml-types
```

Bindings are written to `lib/ledger/generated/`. Do not hand-edit generated files.

### Demo verification scripts (stubs)

```bash
pnpm run ledger:verify-demo-flow      # future end-to-end demo orchestration
pnpm run ledger:attempt-double-spend  # future negative double-spend proof
```

These scripts document the anti-double-spend path explicitly; they do **not** pass the invariant yet.

---

## Project structure

```
app/                    # Next.js App Router pages and future API routes
components/             # Dashboard UI (traceability-view, panels, etc.)
hooks/                  # React hooks (future Party View / ledger hooks)
lib/
  store.ts              # UI/demo state only — NOT custody authority
  data.ts               # Seed accounts, assets, transfers for the mock demo
  ledger/
    client.ts           # Canton client setup (gateway boundary)
    commands.ts         # Ledger command construction
    queries.ts          # Party View-aware queries
    mappers.ts          # Daml/generated type → UI domain mapping
    errors.ts           # Stable ledger error codes
    generated/          # Daml TypeScript bindings (after codegen)
daml/
  daml.yaml             # Daml SDK project config
  Commodity/            # LotPosition, CustodyTransfer, attestation templates
  Scripts/              # Demo ledger seeding scripts
  Test/                 # Contract tests including future double-spend negatives
scripts/
  generate-daml-types.ts
  attempt-double-spend.ts
  verify-demo-flow.ts
```

---

## Architecture boundaries

| Layer | Role |
|---|---|
| `daml/Commodity/*` | Authoritative custody, provenance, quantity conservation |
| `lib/ledger/*` | TypeScript integration; no browser-direct Canton calls |
| `lib/store.ts` | UI selections and demo seed state only |
| `lib/data.ts` | Static demo seed data |
| Supabase (optional) | Evidence document metadata — never custody quantity |
| Privy (optional) | Auth / Party View mapping — does not replace Daml authorization |

---

## Data model (UI demo)

```
Account  ──has many──▶  Asset
Account  ──sends──────▶  Transfer  ◀──receives──  Account
```

Ledger domain terms (Daml): `LotPosition`, `CustodyTransfer`, `EvidenceReference`, `SourceAssetReference`, `TraceabilityAttestation`, `OperationalNode`, `PartyView`.

---

## Built at

**Bedrock Hackathon** · June 2026
