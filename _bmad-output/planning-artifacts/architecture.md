---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-hackaton-2026-06-12/prd.md"
  - "_bmad-output/planning-artifacts/briefs/brief-hackaton-2026-06-12/brief.md"
  - "_bmad-output/planning-artifacts/prds/prd-hackaton-2026-06-12/.decision-log.md"
  - "_bmad-output/planning-artifacts/briefs/brief-hackaton-2026-06-12/.decision-log.md"
workflowType: "architecture"
lastStep: 8
status: "complete"
completedAt: "2026-06-12"
updatedAt: "2026-06-13"
project_name: "hackaton"
user_name: "Diego"
date: "2026-06-12"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 16 functional requirements across five capability groups:

- Commodity lot origination: a producer selects a Commodity, creates an origin Lot Position, and preserves certification metadata through later movements.
- Custody transfer with evidence: Operational Nodes initiate and accept Custody Transfers, attach Evidence References, and show visible transfer history in Party Views.
- Split, combine, and storage operations: parties split Lot Positions for truck transport, combine compatible Lot Positions in silo storage, and create outbound quantities while conserving quantity and provenance.
- Multi-leg custody path: truck transport, silo storage, railway transport, origin port, ship custody, and destination port receipt all act as custody-holding steps in the same ledger model.
- Party Views and Selective Visibility: the UI switches between producer, logistics, storage, origin port, ship, destination port, and non-involved Party Views to demonstrate Canton privacy.
- Custody-chain Attestation: an authorized party generates and presents an Attestation for a selected quantity, including product, quantity, custody path, provenance, certifications, source asset references, and Evidence References.

**Non-Functional Requirements:**
The architecture is shaped primarily by privacy, data integrity, and demo clarity:

- Non-involved parties must not see private Lot Positions, Custody Transfers, Evidence References, or balances.
- Observer/signatory modeling must stay narrow to avoid over-disclosure.
- Quantity changes must conserve quantity across split, combine, transfer, and storage operations.
- Certified quantities must be consumed or archived across state transitions so the same certified source quantity cannot substantiate multiple downstream commodities.
- Evidence References must remain bound to the Custody Transfers used in Attestations.
- The UI must make active Party View, selected Commodity, holdings, and transfer status obvious during a short judge demo.
- The project must include a README that explains setup, privacy model, architecture overview, limitations, and demo script.

**Scale & Complexity:**

- Primary domain: full-stack private-ledger web application.
- Complexity level: medium-high for a hackathon MVP, driven by Canton/Daml privacy modeling, multi-party visibility, provenance preservation, and attestation generation.
- Estimated architectural components: Daml contract model, Canton/ledger integration layer, React dashboard, party-view/demo state, evidence metadata storage, attestation generation/viewing, and seed/demo data.

### Technical Constraints & Dependencies

- Canton and Daml are required for core custody logic.
- React and TypeScript are preferred for frontend and integration work.
- Supabase may be used only for minimal non-ledger data such as document metadata, file references, or app convenience state.
- Evidence files stay off-ledger in the MVP; hashes or references are ledger-bound.
- Privy is optional and should only be included if it improves onboarding or custody UX without risking the Canton MVP.
- The MVP models physical custody only, not commercial ownership, financing, payment settlement, invoice settlement, or warehouse receipt finance.
- Coffee beans and cacao are seeded demo examples, but the data model must remain Commodity-generic.

### Cross-Cutting Concerns Identified

- Selective Visibility: every data structure and query path must respect what the active Party View can see.
- Authorization: custody actions must map to real-world authority without adding broad signatories or observers.
- Quantity Conservation: split, combine, transfer, and storage operations must preserve totals.
- Certified Quantity Single-Use: source Lot Positions and certification-bearing quantities must not remain spendable after transfer, split, merge, or attestation use.
- Provenance Continuity: derived Lot Positions must retain enough Provenance Links for Attestation generation.
- Evidence Binding: Evidence References must stay tied to the relevant Custody Transfers without requiring full document verification.
- Demo Clarity: judges must be able to understand the same flow from multiple Party Views quickly.
- MVP Discipline: architecture should prioritize a crisp Canton privacy demo over a broad supply-chain platform.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack private-ledger web application based on a React/TypeScript frontend, Canton/Daml contract layer, and minimal integration/backend services.

### Starter Options Considered

**Option 1: Continue Existing Next.js Mockup**

The current project already has a public mockup repository with Next.js, TypeScript, Tailwind CSS, shadcn/ui primitives, Zustand, and a traceability dashboard shell. This matches the product's UI-heavy demo needs and avoids spending architecture effort on a fresh frontend scaffold.

Architectural fit:

- Keeps the existing dashboard and component work.
- Aligns with the stated TypeScript/React preference.
- Supports deployment on Vercel or similar frontend hosting.
- Lets the team focus new implementation effort on Canton/Daml, party visibility, and attestation flows.

Risk:

- The existing mockup must be connected to real Canton/Daml data flows instead of static seed data.
- Next.js App Router introduces server/client boundaries that must stay simple for a hackathon MVP.

**Option 2: Fresh Next.js App Router Starter**

The official `create-next-app` starter can create a current TypeScript, Tailwind, ESLint, App Router project.

Initialization command if starting from an empty repo:

```bash
pnpm create next-app@latest supply-chain-canton --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Architectural fit:

- Good fallback if the existing mockup becomes unusable.
- Duplicates work already present in the mockup.

**Option 3: Vite React TypeScript Starter**

The Vite React TypeScript template is lightweight and fast for pure frontend apps.

Initialization command if choosing Vite:

```bash
pnpm create vite supply-chain-canton --template react-ts
```

Architectural fit:

- Good for a simple SPA.
- Less aligned with the existing Next.js mockup and deployment path.

**Option 4: Supabase Next.js Starter**

The official Supabase Next.js starter includes auth, database, Tailwind, and shadcn/ui.

Initialization command if Supabase becomes central:

```bash
pnpm create next-app --example with-supabase supply-chain-canton
```

Architectural fit:

- Useful if Supabase auth/storage becomes a major part of the MVP.
- Too much starter surface if Supabase remains minimal metadata/file-reference storage.

**Option 5: Canton cn-quickstart Reference**

Canton `cn-quickstart` is the strongest reference application for Daml contracts, LocalNet, ledger integration, generated API types, and frontend patterns.

Reference setup:

```bash
git clone https://github.com/digital-asset/cn-quickstart
cd cn-quickstart/quickstart
make setup
make build
make start
```

Architectural fit:

- Excellent reference for Canton/Daml concepts, local development, and party-aware frontend patterns.
- Its Java backend conflicts with the stated TypeScript-first/minimal-backend preference, so it should guide design rather than become the primary app starter.

### Selected Starter: Existing Next.js Mockup + Daml/Canton Reference Skeleton

**Rationale for Selection:**
Use the existing Next.js mockup as the frontend foundation and add Canton/Daml support around it. Use Canton `cn-quickstart` and Daml SDK patterns as references for contract structure, code generation, local ledger testing, and party-aware integration, but do not adopt the Java backend as the main application architecture.

**Initialization Command:**

No new frontend starter should be initialized if the existing repository is available. The first implementation story should clone/use the existing mockup repository and add the Daml/Canton project structure.

Fallback frontend command if starting from empty:

```bash
pnpm create next-app@latest supply-chain-canton --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript for frontend and integration code; Daml for contracts.

**Styling Solution:**
Tailwind CSS and shadcn/ui primitives inherited from the existing mockup.

**Build Tooling:**
Next.js App Router build pipeline for the frontend; Daml SDK/Canton tooling for contracts and local ledger workflows.

**Testing Framework:**
Use the existing frontend lint/build checks plus Daml contract tests/scripts. Add focused integration tests only where they protect custody, quantity conservation, and visibility assumptions.

**Code Organization:**
Keep frontend dashboard components under the existing `app/`, `components/`, `hooks/`, and `lib/` structure. Add a clear `daml/` or `contracts/` area for templates and scripts, plus a small TypeScript integration layer for ledger-facing operations.

**Development Experience:**
Preserve fast frontend iteration while keeping Canton/Daml workflows isolated enough that UI work and contract work do not block each other.

**Note:** The first implementation story should be repository setup: bring in the existing mockup, add the Daml/Canton project skeleton, and document local commands.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Daml/Canton is the source of truth for custody, provenance, quantity conservation, certified-quantity single-use, and Attestation-relevant state.
- Supabase is optional and limited to off-ledger Evidence Reference metadata, file references, or convenience state.
- Each wallet-like Operational Node is modeled as a Canton party; Companies group many Operational Nodes in app metadata.
- Transport vehicles/loads, silo storage, origin port, ship custody, and destination port are Operational Nodes that temporarily or finally hold custody.
- A thin Next.js server/API layer mediates ledger commands and queries; the browser does not talk directly to Canton.
- MVP auth uses a demo Party View switcher; Privy is deferred unless time remains.
- Target demo environment is Next.js on Vercel/local, Canton DevNet or LocalNet for ledger, and optional Supabase for evidence references.

**Important Decisions (Shape Architecture):**

- The existing Next.js mockup remains the frontend foundation.
- Canton `cn-quickstart` is used as a reference for Daml/Canton patterns, not as the primary starter.
- Evidence files stay off-ledger; ledger state stores hashes, content IDs, credential IDs, or signed JSON references.
- Attestation generation reads Canton-visible provenance and emits a selective proof view without granting broad contract visibility.
- Privy SDK remains an optional integration, not a dependency for the MVP.

**Deferred Decisions (Post-MVP):**

- Production user authentication and party permission administration.
- Full document storage permissions and document authenticity verification.
- Public verifier links or EAS-compatible attestations.
- Commodity-specific compliance rule engines.
- Privy prize qualification.

### Data Architecture

**Decision:** Daml/Canton is the source of truth for custody and traceability.

**Version Context:** Canton/Daml should target the active DevNet-compatible SDK version; current public Canton release context found Canton `3.5.3` and Daml SDK management through `dpm`.

**Rationale:** Custody, provenance, split/combine operations, certified-quantity single-use, and selective visibility are the product's core value. Keeping those in Daml makes Canton privacy and authorization central rather than decorative.

**Affects:** Lot Position, Custody Transfer, Provenance Link, Attestation, Party View queries.

**Decision:** Supabase is optional and limited to off-ledger metadata.

**Version Context:** `@supabase/supabase-js` latest stable found as `2.108.1`; it requires Node.js 20+ in recent releases.

**Rationale:** Supabase is useful for document metadata or file-reference convenience, but it must not become the custody source of truth. This avoids weakening the Canton story.

**Affects:** Evidence Reference storage, document upload/reference UI, optional verifier metadata.

**Decision:** Each wallet-like Operational Node is a Canton party.

**Rationale:** A Company can own many wallets/nodes: farms, trucks or transport loads, silo storage, railway transport, origin ports, ships, and destination ports. Modeling the node as the custody-holding party matches the product language and makes party-level visibility demonstrable.

**Affects:** Daml signatories/controllers/observers, Party View switcher, Company grouping metadata, seed data.

**Decision:** Every custody-holding leg is an Operational Node.

**Rationale:** This makes custody explicit while goods move through truck transport, silo storage, railway transport, origin port, ship custody, and destination port receipt. It also keeps the model consistent: the holder of a quantity is always a wallet-like Canton party.

**Affects:** Custody Transfer workflow, split operation, inbound/outbound transfer history, demo party set, Party View switcher, attestation custody path.

### Authentication & Security

**Decision:** MVP uses a demo Party View switcher; Privy is deferred.

**Version Context:** `@privy-io/react-auth` latest found as `3.29.2`, but Privy is not required for the Canton prize path.

**Rationale:** The demo must prove Canton party visibility first. Adding production auth now increases integration risk and does not directly improve Daml privacy modeling. Privy can be added later as a user onboarding layer that maps authenticated users to allowed Party Views.

**Affects:** Demo UX, seed data, README limitations, future auth extension.

**Decision:** Authorization lives primarily in Daml choices and party visibility.

**Rationale:** The backend and UI should not pretend to enforce privacy alone. Daml signatories/controllers/observers must encode who can create, accept, split, combine, transfer, and attest.

**Affects:** Contract design, Next.js gateway checks, tests, privacy demo.

### API & Communication Patterns

**Decision:** Use a thin Next.js server/API layer as the ledger gateway.

**Version Context:** Next.js current stable context found `16.2.9`; the existing app should keep its package versions unless upgraded intentionally.

**Rationale:** The browser should not directly manage Canton party IDs, contract IDs, or ledger command submission. A thin server-side layer centralizes command construction, maps UI actions to ledger workflows, and keeps the frontend demo simple.

**Affects:** `app/api/*` route handlers or server actions, ledger client utilities, generated Daml TypeScript bindings, error handling.

**Decision:** Keep API shape action-oriented for MVP.

**Rationale:** The demo needs commands such as create lot, split lot, initiate transfer, accept transfer, combine lots, create outbound transfer, load ship, receive shipment, generate attestation, and verify attempted double-spend failure. A broad generic CRUD API would obscure ledger workflows.

**Affects:** Frontend hooks/actions, test scripts, README demo script.

### Frontend Architecture

**Decision:** Keep the existing Next.js mockup structure.

**Rationale:** The mockup already has the dashboard shell, account/asset/transfer concepts, Tailwind, shadcn/ui primitives, and Zustand. Architecture should evolve it toward real Canton-backed data rather than restart the frontend.

**Affects:** `app/`, `components/`, `hooks/`, `lib/`, UI state, demo seed migration.

**Decision:** Use client state only for UI/demo state, not custody truth.

**Rationale:** Zustand can hold active Party View, filters, selected Commodity, and selected Lot Position. Canton-derived data should be queried through the gateway and not treated as authoritative client state.

**Affects:** Store boundaries, data fetching, component responsibilities.

### Infrastructure & Deployment

**Decision:** Target Next.js on Vercel/local, Canton DevNet or LocalNet for ledger, optional Supabase for evidence refs.

**Rationale:** This supports the Canton prize requirement while keeping the web app deployable. LocalNet remains useful for development and fallback demos; DevNet is preferred for final judging if stable.

**Affects:** README setup, environment variables, deployment scripts, demo script.

**Decision:** Use Node.js 20+ for the app runtime.

**Rationale:** Current Next/Supabase ecosystem support points to Node.js 20+ as the safe baseline, especially if Supabase JS is used.

**Affects:** package engines, README prerequisites, deployment environment.

### Decision Impact Analysis

**Implementation Sequence:**

1. Bring in the existing Next.js mockup and document local setup.
2. Add Daml/Canton project skeleton and compile/test workflow.
3. Define Daml templates for Operational Node, Lot Position, Custody Transfer, Evidence Reference, source asset references, split/combine, and Attestation.
4. Add seed parties and demo data for Companies, node wallets, coffee beans, cacao, truck transport, silo storage, railway transport, origin port, ship, and destination port.
5. Build the Next.js ledger gateway for core actions.
6. Replace mock frontend data with gateway-backed data by Party View.
7. Add Attestation generation and verifier view.
8. Add optional Supabase evidence metadata if needed.
9. Document DevNet/LocalNet setup and demo script.

**Cross-Component Dependencies:**

- Party View UI depends on Daml party modeling and seed party IDs.
- Attestation generation depends on Provenance Links and source asset references from split/combine/transfer workflows.
- Evidence display depends on Evidence References being bound to Custody Transfers.
- Supabase integration, if used, depends on the Evidence Reference schema but not on custody state.
- Privy, if added later, maps users to Party Views but does not replace Daml authorization.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**

- Daml template and choice naming could drift from PRD/brief terminology, especially around source asset references and multi-leg custody nodes.
- Canton parties, Companies, and Operational Nodes could be modeled inconsistently across contracts, seed data, and UI.
- API routes could become generic CRUD endpoints instead of ledger workflow actions.
- Supabase evidence metadata could accidentally become a second source of custody truth.
- UI state could duplicate ledger state and cause inconsistent Party View behavior.
- Error/loading patterns could obscure whether failures come from Canton, gateway, Supabase, or UI validation.

### Naming Patterns

**Daml Naming Conventions:**

- Use PascalCase for Daml templates and data types: `LotPosition`, `CustodyTransfer`, `EvidenceReference`, `SourceAssetReference`, `TraceabilityAttestation`.
- Use verb phrases for Daml choices: `InitiateTransfer`, `AcceptTransfer`, `SplitLot`, `CombineLots`, `LoadShip`, `ReceiveShipment`, `GenerateAttestation`.
- Use PRD Glossary terms exactly in Daml-facing code: `Commodity`, `Company`, `OperationalNode`, `PartyView`, `ProvenanceLink`, `SourceAssetReference`.
- Avoid synonyms like `Asset`, `Batch`, `Account`, or `Shipment` in new domain code unless explicitly mapped to a Glossary term. If `Shipment` is needed for UI copy, map it to a Custody Transfer or ship-leg Lot Position in domain code.

**Database/Supabase Naming Conventions:**

- Use Supabase only for non-custody support tables.
- Use snake_case table and column names: `evidence_documents`, `document_hash`, `content_id`, `created_at`.
- Every Supabase record that relates to ledger state must store a ledger reference field, such as `transfer_id` or `attestation_id`; it must not store authoritative custody quantity.

**API Naming Conventions:**

- Use action-oriented route names for ledger workflows.
- Use kebab-case URL segments and camelCase JSON fields.
- Preferred route pattern: `/api/ledger/{action}` for ledger actions and `/api/evidence/{action}` for optional evidence metadata.
- Examples: `/api/ledger/create-lot`, `/api/ledger/initiate-transfer`, `/api/ledger/accept-transfer`, `/api/ledger/generate-attestation`.

**Code Naming Conventions:**

- React components use PascalCase: `PartySwitcher`, `LotPositionCard`, `TransferTimeline`.
- Hooks use camelCase with `use` prefix: `usePartyView`, `useVisibleHoldings`, `useLedgerAction`.
- Utility files use kebab-case or existing repo convention; domain symbols inside files use PRD Glossary terms.
- TypeScript domain types use PascalCase and mirror Daml/domain language where possible.

### Structure Patterns

**Project Organization:**

- Keep existing frontend structure: `app/`, `components/`, `hooks/`, `lib/`.
- Place Daml contracts and scripts under `daml/` unless implementation discovers an established Canton convention in the chosen skeleton.
- Place ledger integration utilities under `lib/ledger/`.
- Place optional Supabase utilities under `lib/supabase/`.
- Place seed/demo data under `lib/demo/` or `daml/scripts/`, depending on whether the data seeds UI-only state or ledger state.

**File Structure Patterns:**

- Co-locate UI-only helpers with the component when narrow.
- Shared domain transformations go in `lib/domain/` or `lib/ledger/`, not inside components.
- Daml tests/scripts live alongside Daml contracts or in a Daml-supported test/script folder.
- Documentation for setup and demo belongs in `README.md`; architecture artifacts remain under `_bmad-output/planning-artifacts/`.

### Format Patterns

**API Response Formats:**

Use one consistent response envelope for API routes:

```ts
type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string; details?: unknown } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

**Data Exchange Formats:**

- JSON fields use camelCase.
- Dates/timestamps use ISO 8601 strings.
- Quantities include both amount and unit: `{ amount: "100", unit: "kg" }` or equivalent decimal-safe representation.
- Hashes and content IDs are strings and must include enough metadata to identify the hash/content scheme.
- Never infer missing custody data from Supabase metadata.

### Communication Patterns

**Ledger Action Patterns:**

- UI calls a named action through the Next.js gateway.
- Gateway validates request shape, maps active Party View to the correct Canton party, submits/query ledger operation, and returns `ApiResponse<T>`.
- Components do not construct raw Canton commands.
- Components do not directly manipulate authoritative Lot Position quantities.

**State Management Patterns:**

- Zustand or equivalent client state stores UI state only: active Party View, selected Commodity, filters, selected Lot Position, and transient form state.
- Ledger-derived holdings, transfers, and Attestations are fetched from the gateway and treated as server/ledger state.
- State action names should describe UI intent: `setActivePartyView`, `selectCommodity`, `selectLotPosition`, `setStageFilter`.

### Process Patterns

**Error Handling Patterns:**

- Gateway errors use stable error codes such as `LEDGER_COMMAND_FAILED`, `UNAUTHORIZED_PARTY_VIEW`, `INSUFFICIENT_QUANTITY`, `SOURCE_ASSET_ALREADY_CONSUMED`, `EVIDENCE_REFERENCE_INVALID`, and `ATTESTATION_NOT_AVAILABLE`.
- User-facing messages explain what the operator can do next.
- Internal details may be logged server-side but should not leak private party data to unrelated Party Views.

**Loading State Patterns:**

- Use local loading states for form submissions and route-level loading for page data.
- Disable submit buttons while ledger actions are pending.
- Show Party View-aware empty states, especially for the non-involved company demo view.

### Enforcement Guidelines

**All AI Agents MUST:**

- Use PRD Glossary terms for domain concepts unless explicitly adding a mapped alias.
- Treat Daml/Canton as the custody source of truth.
- Keep Supabase out of custody authority and quantity conservation logic.
- Route ledger operations through the Next.js gateway.
- Preserve Selective Visibility in every UI, API, and data decision.
- Include quantity conservation and provenance continuity checks in contract tests or scripts.
- Include a negative test or scripted demo showing that an already-consumed certified source quantity cannot be reused for another downstream claim.

**Pattern Enforcement:**

- Review every story against this architecture document before implementation.
- Add new domain terms to the PRD/architecture before using them in code.
- If a pattern needs to change, update `architecture.md` before implementing the exception.
- Treat any UI path that exposes another party's data as a blocker.

### Pattern Examples

**Good Examples:**

- `LotPosition` for a custody-holding ledger position.
- `POST /api/ledger/initiate-transfer` for starting a Custody Transfer.
- `POST /api/ledger/load-ship` for transferring origin-port custody onto a ship Operational Node.
- `SourceAssetReference` showing which prior certified quantity supports an Attestation.
- `EvidenceReference` storing `documentHash` and `contentId`, not raw document contents.
- `usePartyView()` storing active demo Party View only.

**Anti-Patterns:**

- Using `Asset`, `Batch`, and `Lot` interchangeably in new code.
- Storing custody quantity in Supabase and syncing it back to Canton.
- Letting the browser submit raw Canton commands directly.
- Adding all Companies as observers to make the demo easier.
- Combining lots without preserving Provenance Links.
- Generating two Attestations from the same consumed source quantity without an explicit remaining balance.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
supply-chain-ethglobal/
├── README.md
├── AGENTS.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── components.json
├── .env.example
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       ├── ledger/
│       │   ├── create-lot/route.ts
│       │   ├── split-lot/route.ts
│       │   ├── initiate-transfer/route.ts
│       │   ├── accept-transfer/route.ts
│       │   ├── combine-lots/route.ts
│       │   ├── create-outbound-transfer/route.ts
│       │   ├── load-ship/route.ts
│       │   ├── receive-shipment/route.ts
│       │   ├── visible-holdings/route.ts
│       │   ├── transfer-history/route.ts
│       │   ├── generate-attestation/route.ts
│       │   └── verify-double-spend/route.ts
│       └── evidence/
│           ├── create-reference/route.ts
│           └── get-reference/route.ts
├── components/
│   ├── traceability-view.tsx
│   ├── party-switcher.tsx
│   ├── commodity-selector.tsx
│   ├── account-list.tsx
│   ├── assets-panel.tsx
│   ├── asset-row.tsx
│   ├── history-panel.tsx
│   ├── transfer-row.tsx
│   ├── attestation-panel.tsx
│   ├── attestation-row.tsx
│   ├── custody-path-timeline.tsx
│   ├── evidence-reference-list.tsx
│   └── ui/
├── hooks/
│   ├── use-party-view.ts
│   ├── use-visible-holdings.ts
│   ├── use-transfer-history.ts
│   ├── use-ledger-action.ts
│   └── use-attestations.ts
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   ├── store.ts
│   ├── data.ts
│   ├── domain/
│   │   ├── quantities.ts
│   │   ├── commodities.ts
│   │   ├── party-view.ts
│   │   ├── source-assets.ts
│   │   └── attestations.ts
│   ├── demo/
│   │   ├── companies.ts
│   │   ├── operational-nodes.ts
│   │   ├── commodities.ts
│   │   ├── custody-path.ts
│   │   └── party-views.ts
│   ├── ledger/
│   │   ├── client.ts
│   │   ├── commands.ts
│   │   ├── queries.ts
│   │   ├── mappers.ts
│   │   ├── errors.ts
│   │   └── generated/
│   ├── evidence/
│   │   ├── references.ts
│   │   └── hashes.ts
│   └── supabase/
│       ├── client.ts
│       └── evidence-documents.ts
├── daml/
│   ├── daml.yaml
│   ├── Main.daml
│   ├── Commodity/Types.daml
│   ├── Commodity/OperationalNode.daml
│   ├── Commodity/LotPosition.daml
│   ├── Commodity/CustodyTransfer.daml
│   ├── Commodity/EvidenceReference.daml
│   ├── Commodity/SourceAssetReference.daml
│   ├── Commodity/TraceabilityAttestation.daml
│   ├── Scripts/SetupDemo.daml
│   └── Test/TraceabilityTest.daml
├── scripts/
│   ├── generate-daml-types.ts
│   ├── seed-demo-ledger.ts
│   ├── attempt-double-spend.ts
│   └── verify-demo-flow.ts
├── tests/
│   ├── ledger/
│   ├── api/
│   └── ui/
└── public/
```

### Architectural Boundaries

**API Boundaries:**

- `app/api/ledger/*` is the only frontend-facing boundary for Canton commands and queries.
- `app/api/evidence/*` is the optional boundary for Supabase-backed Evidence Reference metadata.
- API routes return the shared `ApiResponse<T>` envelope.
- Browser components do not call Canton APIs directly.

**Component Boundaries:**

- `components/*` renders Party View, holdings, transfers, evidence, and Attestations.
- Components consume hooks and domain types; they do not construct ledger commands.
- `traceability-view.tsx` remains the dashboard shell.
- `party-switcher.tsx` controls active Party View for demo purposes.
- `commodity-selector.tsx` controls selected Commodity filter or creation input.

**Service Boundaries:**

- `lib/ledger/client.ts` owns low-level Canton/ledger client setup.
- `lib/ledger/commands.ts` owns command construction for create/split/transfer/combine/attest workflows.
- `lib/ledger/queries.ts` owns Party View-aware queries.
- `lib/ledger/mappers.ts` translates Daml/generated types into UI domain types.
- `lib/evidence/*` owns hash/reference utilities.
- `lib/supabase/*` is optional and cannot expose custody source-of-truth APIs.

**Data Boundaries:**

- Daml/Canton owns Lot Positions, Custody Transfers, Provenance Links, Evidence References bound to transfers, and Attestation-relevant state.
- Supabase may own document metadata or file references only.
- Zustand/client store owns UI state only.
- Demo seed data may define Companies and Operational Node labels, but ledger state owns custody.

### Requirements To Structure Mapping

**Commodity Lot Origination (FR-1 to FR-3):**

- Daml: `Commodity/Types.daml`, `Commodity/OperationalNode.daml`, `Commodity/LotPosition.daml`
- API: `app/api/ledger/create-lot/route.ts`
- UI: `commodity-selector.tsx`, `assets-panel.tsx`, `asset-row.tsx`
- Domain: `lib/domain/commodities.ts`, `lib/domain/quantities.ts`

**Custody Transfer With Evidence (FR-4 to FR-7):**

- Daml: `Commodity/CustodyTransfer.daml`, `Commodity/EvidenceReference.daml`
- API: `initiate-transfer`, `accept-transfer`, `transfer-history`
- UI: `history-panel.tsx`, `transfer-row.tsx`, `evidence-reference-list.tsx`
- Ledger integration: `lib/ledger/commands.ts`, `lib/ledger/queries.ts`

**Split, Combine, Storage, And Multi-Leg Custody (FR-8 to FR-10 plus updated brief path):**

- Daml: `Commodity/LotPosition.daml`, `Commodity/CustodyTransfer.daml`
- API: `split-lot`, `combine-lots`, `create-outbound-transfer`, `load-ship`, `receive-shipment`
- Domain: `lib/domain/quantities.ts`, `lib/demo/custody-path.ts`
- Tests: `daml/Test/TraceabilityTest.daml`, `tests/ledger/`
- Custody path nodes: truck transport, silo storage, railway transport, origin port, ship, destination port

**Party Views And Selective Visibility (FR-11 to FR-13):**

- UI: `party-switcher.tsx`, `traceability-view.tsx`
- Hooks: `use-party-view.ts`, `use-visible-holdings.ts`, `use-transfer-history.ts`
- API: `visible-holdings`, `transfer-history`
- Demo data: `lib/demo/companies.ts`, `lib/demo/operational-nodes.ts`, `lib/demo/party-views.ts`
- Required views: producer, truck logistics, railway logistics, silo storage, origin port, ship operator, destination port, non-involved company

**Custody-Chain Attestation (FR-14 to FR-16):**

- Daml: `Commodity/TraceabilityAttestation.daml`, `Commodity/SourceAssetReference.daml`
- API: `generate-attestation`, `verify-double-spend`
- UI: `attestation-panel.tsx`, `attestation-row.tsx`, `custody-path-timeline.tsx`, `evidence-reference-list.tsx`
- Domain: `lib/domain/attestations.ts`, `lib/domain/source-assets.ts`
- Test/script: `scripts/attempt-double-spend.ts` and Daml tests must show consumed certified quantities cannot be reused.

### Integration Points

**Internal Communication:**

- UI component → hook → API route → `lib/ledger/*` → Canton/Daml.
- UI component → hook → API route → `lib/evidence/*` → optional Supabase.
- API route → shared response envelope → hook loading/error state → component rendering.

**External Integrations:**

- Canton DevNet or LocalNet for ledger state and Daml command execution.
- Optional Supabase for Evidence Reference metadata and file references.
- Optional Privy later for user login and Party View authorization mapping.

**Data Flow:**

1. Producer creates a Lot Position through UI and ledger gateway.
2. Daml creates custody state visible only to authorized parties.
3. Truck, silo, railway, origin port, ship, and destination port actions mutate custody state through Daml choices.
4. Each split, combine, transfer, ship load, and shipment receipt archives or consumes the prior spendable custody position and creates the next one.
5. Evidence References are bound to Custody Transfers, optionally with Supabase metadata.
6. Party View queries return only visible holdings/transfers.
7. Attestation generation reads visible provenance and source asset references, then emits selective proof data.
8. A negative double-spend demo attempts to reuse a consumed source quantity and fails.

### File Organization Patterns

**Configuration Files:**

- Root config remains in existing Next.js files.
- `.env.example` documents Canton, Supabase, and optional Privy variables.
- `daml/daml.yaml` pins Daml SDK/package configuration.

**Source Organization:**

- UI stays under `app/`, `components/`, and `hooks/`.
- Domain logic goes under `lib/domain/`.
- Ledger integration goes under `lib/ledger/`.
- Optional evidence/Supabase integration stays isolated under `lib/evidence/` and `lib/supabase/`.

**Test Organization:**

- Daml contract tests/scripts live under `daml/Test/` and `daml/Scripts/`.
- API tests live under `tests/api/`.
- Ledger integration tests or scripted checks live under `tests/ledger/`.
- UI tests, if added, live under `tests/ui/`.

**Asset Organization:**

- Static assets stay under `public/`.
- Demo document fixtures, if needed, should live under `public/demo-documents/` or `tests/fixtures/`, not mixed with authoritative ledger state.

### Development Workflow Integration

**Development Server Structure:**

- Next.js dev server runs the UI and API routes.
- Canton LocalNet or DevNet provides ledger runtime.
- Optional Supabase can be disabled if Evidence References are mocked as hashes/metadata only.

**Build Process Structure:**

- Frontend build uses existing Next.js scripts.
- Daml build/test runs separately and should be documented in README.
- Generated Daml TypeScript bindings go under `lib/ledger/generated/` and should be regenerated by script.

**Deployment Structure:**

- Frontend/API can deploy to Vercel or run locally.
- Canton deployment targets DevNet for final demo if available, with LocalNet as fallback.
- Supabase deployment is optional and only required if the MVP stores evidence metadata remotely.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
The major decisions work together. Daml/Canton owns custody truth, the Next.js gateway mediates ledger access, Supabase is limited to optional off-ledger evidence metadata, and the existing React dashboard remains the UI foundation. The deferred Privy decision does not block the Canton MVP because the demo Party View switcher is explicitly scoped as the MVP auth substitute.

**Pattern Consistency:**
The implementation patterns support the decisions. Daml naming follows PRD Glossary terms, API routes are action-oriented around ledger workflows, client state is limited to UI/demo state, and Supabase naming is explicitly isolated from custody authority.

**Structure Alignment:**
The project structure supports the architecture. `app/api/ledger/*` owns ledger-facing API boundaries, `lib/ledger/*` owns Canton integration, `daml/Commodity/*` owns contract logic, `components/*` owns dashboard rendering, and `lib/demo/*` owns non-authoritative demo labels and party metadata.

### Requirements Coverage Validation ✅

**Feature Coverage:**
All five PRD feature groups and the updated product-brief custody path have mapped architectural support:

- Commodity Lot Origination → Daml lot templates, `create-lot` route, commodity selector, holdings UI.
- Custody Transfer With Evidence → custody/evidence Daml templates, transfer routes, transfer history UI, evidence components.
- Split, Combine, Storage, And Multi-Leg Custody → Lot Position/Custody Transfer templates, quantity domain helpers, split/combine/outbound/load-ship/receive-shipment routes.
- Party Views And Selective Visibility → Party switcher, visible holdings/history routes, demo party data, Daml party model for producer, truck logistics, railway logistics, silo, origin port, ship, destination port, and non-involved company.
- Custody-Chain Attestation And Anti-Double-Spend → attestation/source asset Daml templates, generation route, double-spend verification route, attestation panel, custody path timeline, and evidence binding display.

**Functional Requirements Coverage:**
FR-1 through FR-16 are architecturally supported by the Daml contract area, Next.js gateway routes, domain helpers, UI components, hooks, and tests/scripts mapped in the project structure. The updated brief adds explicit truck → silo → rail → origin port → ship → destination port custody and certified-quantity anti-double-spend behavior; these are now covered by the multi-leg custody routes, source asset references, and negative double-spend script/test guidance.

**Non-Functional Requirements Coverage:**
The core NFRs are supported:

- Privacy/selective visibility is addressed through Daml parties, narrow authorization, and Party View-aware queries.
- Quantity conservation is addressed through Daml contract choices and contract tests/scripts.
- Certified-quantity single-use is addressed through archived/consumed source positions, Source Asset References, and negative double-spend tests/scripts.
- Evidence binding is addressed through Evidence References tied to Custody Transfers.
- Demo clarity is addressed through dedicated Party Switcher, Commodity Selector, holdings, history, and Attestation panels.
- README/demo readiness is addressed as a required first implementation and handoff artifact.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Critical decisions are documented with rationale and version context where relevant: Canton/Daml, Next.js, Supabase JS, Privy SDK, Node.js baseline, party model, transport model, API boundary, auth scope, and deployment target.

**Structure Completeness:**
The project structure is specific enough for implementation agents. It identifies root files, API routes, UI components, hooks, domain utilities, ledger integration files, optional Supabase files, Daml contracts, scripts, and test locations.

**Pattern Completeness:**
Naming, structure, response formats, data exchange formats, ledger action patterns, state boundaries, error handling, loading state handling, and anti-patterns are documented.

### Gap Analysis Results

**Critical Gaps:**
None found.

**Important Gaps:**

- Exact Canton DevNet/Seaport SDK and deployment settings must be verified during implementation against the current deployment guide. The architecture records current public Canton release context but intentionally does not hard-code DevNet compatibility.
- The architecture assumes the existing Next.js mockup repository is available as the frontend base. If it is unavailable or diverges heavily, the fallback `create-next-app` path should be used.
- The PRD remains marked `draft` and still uses the shorter custody path in some sections. Reconcile the PRD with the updated brief and architecture before epics/stories are generated.

**Nice-to-Have Gaps:**

- Add a diagram in README showing UI → Next.js gateway → Canton/Daml → optional Supabase.
- Add a small glossary mapping from prior mockup terms (`Account`, `Asset`, `Transfer`) to PRD terms (`Operational Node`, `Lot Position`, `Custody Transfer`) before implementation.
- Add a demo seed table for Company → Operational Node → Canton party IDs, covering truck, silo, rail, origin port, ship, and destination port nodes.

### Validation Issues Addressed

No critical issues required redesign. The only material concern, DevNet SDK/deployment compatibility, is handled as an implementation verification requirement rather than an architecture blocker.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High for MVP implementation; medium for live DevNet deployment until the current Seaport/DevNet setup is verified.

**Key Strengths:**

- Canton privacy is central rather than decorative.
- Custody source of truth is clearly separated from optional Supabase metadata.
- Party/wallet modeling matches the product language.
- Certified-quantity anti-double-spend behavior is captured as a ledger invariant, not a UI convention.
- Existing frontend work is preserved.
- Agent-facing consistency rules are concrete enough to prevent naming and boundary drift.

**Areas For Future Enhancement:**

- Production auth and Party View permissions, potentially with Privy.
- Full document storage and document authenticity verification.
- EAS-compatible or public verifier attestations.
- Commodity-specific certification compatibility rules.
- More robust integration/e2e testing after the MVP flow works.

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for architectural questions.
- Treat privacy leaks across Party Views as blockers.

**First Implementation Priority:**
Bring in the existing Next.js mockup, add the Daml/Canton skeleton, document local commands, and create the first Daml contract/test path for `LotPosition`, `CustodyTransfer`, `SourceAssetReference`, and a negative double-spend attempt.
