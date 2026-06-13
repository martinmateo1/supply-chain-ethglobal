# Pitch — Private Commodity Traceability on Canton

> A private, double-spend-proof custody ledger for certified commodities — built on Canton/Daml,
> demonstrated end to end with a Next.js dashboard.

---

## 1. The one-liner

**Prove where a certified commodity came from, without exposing anyone's inventory, routes, or
counterparties to competitors.** We track the physical custody of coffee and cacao across a
multi-company supply chain on Canton, so every party sees only what it is entitled to — and the
same certified quantity can never be spent twice.

---

## 2. The problem

Bulk agricultural supply chains are "traceable on paper," but the truth is fragmented across
farms, truckers, silos, railways, ports, and vessels. Two failures keep recurring:

1. **Provenance is slow and untrustworthy.** A single batch is split across trucks, mixed in
   storage, split again, and aggregated at a port. Reconstructing the chain after the fact means
   chasing documents between companies.
2. **Certified material gets double-spent.** The same certification or lot reference is reused to
   sell more "sustainable" commodity than the certified quantity actually supports. Paper and
   siloed databases let the same proof be copied across deals.

The naive blockchain answer — a public ledger of every transfer and balance — **does not fit the
business reality.** No company wants its stock levels, suppliers, customers, routes, or port
positions visible to the entire network. That turns private operational data into free market
intelligence for competitors.

---

## 3. Why Canton (not a public chain)

This is a **Daml-native privacy application**, not "supply chain on blockchain" in the abstract.

- **Party-level privacy by default.** Only signatories, controllers, and selected observers see a
  contract. A producer's lots, a logistics company's legs, and a silo's balances are private to
  the parties involved in each custody event.
- **Conservation across state transitions.** When a certified quantity is transferred, split, or
  merged, the prior custody contract is archived atomically and a new one is created. The old
  state is no longer spendable — so the **anti-double-spend guarantee holds without revealing the
  full inventory graph** to the whole network.
- **Selective disclosure for auditors/buyers.** A traceability attestation can be shared with a
  buyer or regulator as an observer, instead of granting access to the entire ledger.

A public chain would force every balance and transfer into the open. Canton gives us the proof
**and** the privacy.

---

## 4. What we built

A web dashboard where the user acts as a selected **company party** and sees only that party's
entitled data. Behind it, **Canton/Daml is the source of truth** for custody, quantity
conservation, and certified-quantity single-use.

The seeded demo network models a real export route across 7 parties:

| Party (node id) | Company | Role |
|---|---|---|
| `production-site` | Origin Cooperative | Creates certified origin lots |
| `truck-transport` | Andes Freight Logistics | First-mile road custody |
| `silo` | Silo Storage Co. | Receive / store / split / merge |
| `railway-transport` | Pacific Rail Logistics | Silo → port terminal |
| `origin-port` | Buenaventura Port Terminal | Load onto vessel |
| `ship` | Bluewater Logistics | Ocean leg |
| `destination-port` | Rotterdam Port Terminal | Receive + issue attestation |

Seeded with coffee and cacao lots across grades A/B/C and certifications (Non-GMO,
Deforestation-Free). The data model is generic — the commodity is configurable metadata, so the
same custody model works for other products.

**Architecture in one line:** Browser → Next.js gateway (`app/api/ledger/*`, `lib/ledger/*`) →
Canton JSON Ledger API → Daml contracts. The browser never submits raw ledger commands;
custody authority never lives in the frontend store.

---

## 5. Live demo script (~3 minutes)

Set `LEDGER_BACKEND=canton`, run `pnpm run ledger:bringup`, then `pnpm dev`. Keep a second
terminal with the Canton console (`dpm canton-console`) or the offset watcher visible.

1. **Privacy by perspective.** Open the dashboard as **Origin Cooperative** — its lots are
   visible. Switch to an unrelated company → holdings are empty with the Canton privacy note (not
   a loading error). Switch to a route party → records reappear. *This is selective visibility, on
   the ledger.*
2. **Custody moves on Canton.** As the producer, initiate a transfer to the trucking company. In
   the second terminal the **ledger offset increments**. Accept it as the receiver → it increments
   again. Each action is a Daml choice.
3. **Provenance preserved through split/merge.** Move a quantity into the silo, split it, and send
   an outbound rail leg. The chain stays linked from origin to current holder.
4. **Double-spend is rejected.** Run `pnpm ledger:attempt-double-spend` — Daml refuses to spend an
   already-consumed certified quantity. *This is the core guarantee, enforced by the contract, not
   the UI.*
5. **Attestation.** At the destination port, generate a custody-chain attestation: product,
   quantity, origin, certifications, full custody path, source-asset references, and document
   hashes.

**The "it's really Canton" moment:** in the console, `sandbox.dars.list()` shows the
`commodity-traceability` package whose `mainPackageId` **matches `CANTON_PACKAGE_ID` in
`.env.local`** — the app points at that exact on-ledger package. (See
[`docs/demo-setup.md` §7](./demo-setup.md) for the exact commands.)

---

## 6. What makes it credible

- **Real Daml contracts**, not a mock: lot creation, custody transfer, split/merge, and
  attestation, with custody authority owned by the ledger.
- **Anti-double-spend proven negatively** via `submitMustFail`-style scripts, not a silent happy
  path.
- **Privacy proven by switching parties** — non-involved companies see nothing.
- **Evidence bound by hash**, files stay off-ledger — the ledger anchors proof without becoming a
  document store.

---

## 7. Scope & honesty

**In scope (MVP):** custody lifecycle (create, transfer, split, merge, receive, attest), party
switcher for privacy, commodity selector, document metadata + hashes, custody-chain attestation.

**Out of scope:** payments/financing/settlement, real GPS/IoT, full verifiable-credential stack,
public marketplace. Attestation is off-ledger for the MVP with a hash anchored to Canton-visible
state. Supabase is optional (evidence metadata only) and Privy is not assumed.

---

## 8. The vision

A private provenance layer for commodity supply chains: companies exchange custody proofs without
exposing their operating graph, and buyers or auditors verify selected claims about origin,
certification, custody, and documents. From physical traceability, it can extend into tokenized
warehouse receipts, trade finance, insurance, and compliance — once the core custody model is
proven. **That model is what this demo proves today.**

---

## 9. Ask / prize fit

Targeting the **Canton Foundation** prize as a Daml-native privacy application: the value is
private, multi-party custody with a real anti-double-spend guarantee and selective disclosure —
exactly what a public ledger cannot offer.

> Setup, ports, console commands, and the full runbook live in
> [`docs/demo-setup.md`](./demo-setup.md).
