# Grain Chain — Supply Chain Traceability

A real-time supply chain traceability dashboard for agricultural commodities built at the Bedrock Hackathon. Track certified grain (soybeans, wheat, corn) from field to processing plant with full transparency on certifications, ratings, and custody transfers.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)

---

## What it does

Grain Chain lets you follow a batch of certified grain across every node in the supply chain:

| Stage | Icon | Description |
|---|---|---|
| **Field** | 🌱 | Origin — farm or agricultural producer |
| **Transport** | 🚛 | Logistics leg between nodes |
| **Silo** | 🏭 | Storage and aggregation point |
| **Port** | ⚓ | Export terminal |
| **Processing Plant** | 🏗️ | End-point manufacturing |

Each account holds **assets** (lots of grain) that carry:
- **Commodity** — soybean, wheat, or corn
- **Certifications** — `NON-GMO` and/or `Deforestation-free`
- **Quality rating** — A / B / C
- **Quantity** in metric tons

Transfers between accounts are recorded immutably, preserving the certification chain of custody at every hop.

---

## Features

- **Account explorer** — browse all supply chain nodes, filter by stage type
- **Asset ledger** — view current holdings per account with commodity icons and certification badges
- **Transfer history** — full audit log of custody transfers between nodes
- **Traceability view** — select any account and see its complete inbound/outbound transfer graph
- **Dark mode** — fully styled for both light and dark themes
- **Responsive layout** — works on desktop and tablet

---

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router)
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
  store.ts              # Zustand store (selected account, filters)
  utils.ts              # Shared helpers
```

---

## Data model

```
Account  ──has many──▶  Asset
Account  ──sends──────▶  Transfer  ◀──receives──  Account
```

Assets and transfers are keyed by commodity + certification combination so that certified lots can be distinguished from uncertified ones throughout the chain.

---

## Built at

**Bedrock Hackathon** · June 2026
