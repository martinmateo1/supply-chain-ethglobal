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

Transfers between accounts update custody state while preserving the certification chain of custody at every hop.

---

## Features

- **Combined commodity view** — inspect coffee beans and cacao in the same custody flow
- **Party View switcher** — selective visibility across operational nodes
- **Asset ledger** — view current holdings per account with commodity icons and certification badges
- **Transfer history** — audit log of custody transfers between nodes
- **Canton ledger integration** — optional `LEDGER_BACKEND=canton` path with Daml-enforced conservation and anti-double-spend
- **Dark mode** — fully styled for both light and dark themes
- **Responsive layout** — works on desktop and tablet

---

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) component primitives
- [Zustand](https://zustand-demo.pmnd.rs/) for **UI state only** (not custody truth under Canton)
- [Daml](https://www.digitalasset.com/developers) / [Canton](https://www.digitalasset.com/developers) 3.5.1 via **`dpm`**
- [Lucide React](https://lucide.dev/) icons

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Next.js app and TypeScript tooling |
| pnpm | 9+ | Package manager |
| dpm | 1.x | Daml SDK 3.5.1 (`~/.dpm/bin/dpm`) |
| Java 17 | Temurin recommended | Daml Script / Canton sandbox |

---

## Getting started

### Frontend (UI demo — default)

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

By default `LEDGER_BACKEND=demo`. Custody state is validated by the gateway and persisted in the browser for the offline demo.

### Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm verify:custody-transfers
pnpm verify:party-visibility
```

### Daml / Canton (ledger-backed demo)

Install tooling via [dpm](https://docs.digitalasset.com/build/3.5/dpm/dpm.html), then from the repo root:

```bash
# 1. Compile contracts + run Daml Script tests
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
dpm build
dpm test

# 2. One-shot local ledger bring-up (build, sandbox, upload DAR, SetupDemo, codegen)
pnpm run ledger:bringup
```

Manual steps (equivalent to `ledger:bringup`):

```bash
dpm build
dpm sandbox                    # gRPC :6865, JSON API :6864
dpm script \
  --dar .daml/dist/commodity-traceability-0.0.1.dar \
  --script-name Scripts.SetupDemo:setupDemo \
  --ledger-host localhost \
  --ledger-port 6865 \
  --upload-dar true
pnpm run generate:daml-types
```

`SetupDemo` prints `DEMO_PARTY <node-id>=<party-id>` lines. Party hints match operational node ids (`production-site`, `truck-transport`, …).

Configure the Next.js app:

```env
LEDGER_BACKEND=canton
CANTON_LEDGER_HOST=http://localhost:6864
CANTON_LEDGER_ID=sandbox
CANTON_PACKAGE_ID=<hash from dpm inspect-dar .daml/dist/commodity-traceability-0.0.1.dar>
```

Then:

```bash
pnpm dev
```

Verify the Canton path:

```bash
LEDGER_BACKEND=canton \
CANTON_LEDGER_HOST=http://localhost:6864 \
CANTON_LEDGER_ID=sandbox \
CANTON_PACKAGE_ID=<package-id> \
pnpm ledger:verify-demo-flow

pnpm ledger:attempt-double-spend   # same env vars
```

### Generated TypeScript bindings

```bash
pnpm run generate:daml-types
```

Output: `lib/ledger/generated/`. Do not hand-edit generated files.

---

## Project structure

```
app/api/ledger/         # Custody gateway routes (demo + Canton dispatch)
components/             # Dashboard UI
hooks/                  # useCustodyGateway, useLedgerSync
lib/
  store.ts              # UI/demo state; custody not persisted under Canton
  ledger/
    canton-custody-service.ts
    client.ts             # Canton JSON API v2 client
    gateway.ts            # LEDGER_BACKEND dispatch
    generated/            # dpm codegen-js output
daml/                   # Daml source (custody source of truth)
scripts/
  ledger-bringup.sh
  verify-demo-flow.ts
  attempt-double-spend.ts
daml.yaml               # Daml project config (repo root)
```

---

## Architecture boundaries

| Layer | Role |
|---|---|
| `daml/Commodity/*` | Authoritative custody, provenance, quantity conservation |
| `lib/ledger/*` | Server-side Canton integration; no browser-direct ledger calls |
| `app/api/ledger/*` | Stable gateway boundary for the UI |
| `lib/store.ts` | UI selections; under Canton, holdings are fetched from the gateway |
| `LEDGER_BACKEND=demo` | Offline demo adapter fallback |

---

## Built at

**Bedrock Hackathon** · June 2026
