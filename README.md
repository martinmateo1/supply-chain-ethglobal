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
- [Zustand](https://zustand-demo.pmnd.rs/) for client state
- [Lucide React](https://lucide.dev/) icons

---

## Getting started

```bash
# Install dependencies
pnpm install

# Run the dev server
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
  page.tsx              # Entry point — renders TraceabilityView
  layout.tsx            # Root layout with theme provider
  globals.css           # Global styles

components/
  traceability-view.tsx # Main dashboard shell
  account-list.tsx      # Left-rail account browser
  assets-panel.tsx      # Asset holdings panel
  asset-row.tsx         # Single asset row
  history-panel.tsx     # Transfer history panel
  transfer-row.tsx      # Single transfer row
  ui/                   # Shared primitives (tabs, select, label, item)

lib/
  types.ts              # Domain types + metadata constants
  data.ts               # Seed data — accounts, assets, transfers
  store.ts              # Zustand store (selected account, assets, transfers)
  utils.ts              # Shared helpers
```

---

## Data model

```
Account  ──has many──▶  Asset
Account  ──sends──────▶  Transfer  ◀──receives──  Account
```

Assets and transfers are keyed by commodity + certification combination so that certified lots can be distinguished throughout the chain.

---

## Built at

**Bedrock Hackathon** · June 2026
