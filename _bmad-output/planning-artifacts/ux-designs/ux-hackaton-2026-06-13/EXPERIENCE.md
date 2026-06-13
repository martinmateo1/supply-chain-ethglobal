---
title: "Private Commodity Traceability on Canton Experience"
status: "draft"
created: "2026-06-13"
updated: "2026-06-13"
sources:
  - "../../prds/prd-hackaton-2026-06-12/prd.md"
  - "../../briefs/brief-hackaton-2026-06-12/brief.md"
  - "existing-screen-audit.md"
---

# Private Commodity Traceability on Canton — Experience Spine

## Foundation

Desktop-first web dashboard built with Next.js App Router, React, Tailwind, and shadcn/ui. The current implementation already provides the right base IA: a main traceability dashboard, a sliding transfer side panel, a fixed party switcher, and an asset detail route.

`DESIGN.md` is the visual identity reference. This spine defines how the existing screens should behave, which gaps must be filled, and which current behaviors are acceptable only as MVP shortcuts.

The UX is a guided demo surface, not a general ERP. The highest-priority experience goal is that a judge can understand in under five minutes that Canton enables custody-chain traceability without broad visibility.

## Information Architecture

| Surface | Reached from | Current status | Purpose |
|---|---|---|---|
| Traceability dashboard | `/` | Existing | Active party view, visible holdings, sent/received transfers, guided demo callouts |
| Transfer side panel | Dashboard → Transfer Assets | Existing | Move selected quantity to another operational node and attach evidence |
| Asset detail | `/assets/[id]` from asset row | Existing | Inspect current custody, visible transfer activity, evidence hashes, and attestation context |
| Create lot side panel | Dashboard as production-site party | Gap | Originate a commodity lot with metadata and certifications |
| Split/combine explanation | Dashboard rows + asset detail | Gap | Explain quantity conservation, partial transfer splits, and compatible destination aggregation |
| Attestation panel | Asset detail for destination-port asset | Gap | Generate attestation for selected quantity |
| Verifier panel | Attestation panel → Share/View verifier | Gap | Read-only buyer/auditor view that proves selected custody chain without full ledger visibility |
| Non-involved party dashboard | Party switcher → non-involved company | Gap | Empty-state proof that unrelated companies see no private holdings, transfers, or evidence |

The primary dashboard remains one surface. New mutating actions should be side panels or contextual panels. New read-only proof moments should be detail sections or focused panels. Avoid adding a deep route tree unless the current route needs a stable shareable URL.

## Voice and Tone

Microcopy should explain privacy and evidence in operator language. Brand posture lives in `DESIGN.md`.

| Do | Don't |
|---|---|
| "Only involved custodians can see this lot." | "Permission denied." |
| "No private contracts are visible to this company." | "No data found." |
| "Hash bound to transfer t2." | "Uploaded successfully." |
| "Partial transfer split 12,500t from the source lot." | "Transfer complete." when quantity behavior matters |
| "Verifier can inspect this attestation without seeing unrelated balances." | "Share all supply-chain data." |

Use "party view" and "company role" consistently in the visible product. The flow documentation uses named protagonists for BMAD traceability, but the UI should emphasize company roles over personal names, per discovery.

## Component Patterns

Behavioral rules. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| App shell | Dashboard | Maintains the existing single-dashboard structure. The active party and demo step must remain visible while panels open. |
| Party switcher | Global | Switches company role immediately. Changing party changes holdings, history, asset visibility, and privacy callouts. |
| Demo stepper | Dashboard | Frames the custody route. Clicking a step highlights the relevant party/surface when available; it must not mutate ledger state by itself. |
| Privacy callout | Dashboard, detail, verifier, empty states | Explains why records are visible or hidden. Must be prominent, not buried in tooltips. |
| Holdings list | Dashboard Assets tab | Shows only holdings visible to the active party. For non-involved company, shows the privacy empty state. |
| History list | Dashboard History tab | Shows sent/received transfers for the active party. If pending transfers are added, separate pending from completed. |
| Asset row | Holdings list | Opens asset detail. Shows commodity, quantity, grade, certification badges, and optional split/combine indicators. |
| Transfer side panel | Dashboard | Sender selects visible asset, quantity, destination, evidence references, reviews summary, then confirms. Current immediate confirmation is an MVP shortcut. |
| Certificate dropzone | Transfer panel | Accepts supported file types, hashes locally, shows readable document cards. Errors stay inline. |
| Create lot panel | Production-site dashboard | Available only for production-site parties. Creates initial lot with commodity, quantity, origin, grade, certifications, and optional origin evidence. |
| Split/combine indicator | Rows and detail | Explains implicit splits and compatible combines. Must show quantity before/after and source/derived references when implementation supports them. |
| Asset detail | Detail route | Blocks unauthorized parties. For authorized parties, shows why visible, current custody, custody activity, evidence, and attestation actions. |
| Attestation panel | Asset detail | Generates or previews an attestation only when selected quantity has enough custody/evidence context. Missing evidence produces a warning, not silent success. |
| Verifier panel | From attestation | Read-only. Shows attestation summary, custody path, document hashes, issuer, recipient, timestamp, and verification status. No full holdings table. |
| Empty privacy state | Non-involved company | Proves that no private contracts, holdings, transfers, evidence, or attestations are visible to unrelated parties. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold load | Dashboard | Existing shadcn-style skeleton or neutral loaded state is acceptable. Active party defaults to Origin Cooperative. |
| No assets in involved party | Assets tab | Existing empty state is acceptable: assets will appear after transfers or lot creation. |
| Non-involved party | Assets and History tabs | Replace generic empty text with privacy proof: "No private contracts visible." Explain this is expected Canton selective visibility. |
| Unauthorized asset detail | Asset detail | Existing blocked state is correct; add clearer path to switch party or return to dashboard. |
| Transfer no source assets | Transfer panel | Disable asset selector and explain the active party has no movable holdings. |
| Transfer over quantity | Transfer panel | Disable confirm. Inline error states quantity cannot exceed available lot quantity. |
| Transfer evidence hashing | Certificate dropzone | Existing "Hashing files..." state is correct. Keep file selection blocked while hashing. |
| Transfer confirmed | Transfer panel | Existing success state is acceptable. Add split/combine copy when quantity was partial or destination aggregated. |
| Pending transfer | Dashboard/History | Gap. If implemented, show pending inbound transfers as a separate section with Accept/Reject actions. |
| Certification mismatch | Combine/split context | Gap. Show compatibility mismatch inline; do not allow combine. |
| Attestation unavailable | Asset detail | Explain that attestation requires destination-port receipt or sufficient custody chain context. |
| Attestation missing evidence | Attestation panel | Warning state with list of custody steps lacking evidence references. |
| Verifier valid | Verifier panel | Blue privacy callout plus verification status. Show selected proof only, not full ledger data. |

## Interaction Primitives

- Click/tap to act. No drag-and-drop for custody route construction; drag is only for file upload.
- Side panels close with explicit close button and `Esc`.
- Party switching is immediate and reversible.
- Mutating actions require a visible review summary before confirmation.
- Asset detail remains read-only except attestation generation.
- Keyboard support follows shadcn defaults: `Tab` order by reading order, visible focus rings, `Enter`/Space on buttons and upload target.
- Banned for MVP: hidden hover-only actions, modal stacks deeper than one, map-first navigation, animated blockchain diagrams, and broad ledger explorer views that expose unrelated data.

## Accessibility Floor

Behavioral floor. Visual contrast and token usage live in `DESIGN.md`.

- WCAG 2.2 AA target for dashboard, panels, and verifier.
- Every party switch option must expose role/company name and visible total to assistive tech.
- Privacy empty state must be announced as intentional, not an error.
- File upload target is keyboard-operable and announces processing/errors.
- Hashes must be selectable/copyable in final implementation.
- Focus order in side panels: close, title/description, form fields, evidence upload, summary, confirm.
- Reduced motion should shorten or remove the dashboard slide transition for the transfer/create/attestation side panel.

## Responsive & Platform

Desktop web is primary. The current dashboard is allowed to be desktop-first for hackathon judging.

| Breakpoint | Behavior |
|---|---|
| `>= 1024px` | Full dashboard width, fixed lower-left party switcher, sliding right-side panels. |
| `768-1023px` | Dashboard remains usable; side panel may overlay instead of slide. |
| `< 768px` | Read-only review and simple transfer may work, but not a primary success criterion. Avoid optimizing the MVP around mobile field use. |

## Existing Coverage and Gap Fill

The current screens are retained. UX work should fill gaps in this order:

1. Non-involved company party plus strong privacy empty state.
2. Guided demo stepper/callouts around the existing dashboard.
3. Production-site create-lot panel.
4. Explicit split/combine/provenance explanation for partial transfer and compatible destination aggregation.
5. Destination-port attestation generation plus in-app verifier panel.
6. Pending inbound transfer accept/reject flow required for FR-5, unless the PRD is explicitly descoped before implementation.

## Inspiration & Anti-patterns

- **Lifted from the existing app:** the one-dashboard model, fixed party switcher, and sliding workflow panel. The UX contract preserves these rather than replacing them.
- **Lifted from shadcn/ui:** neutral semantic tokens, compact list rows, accessible controls, and simple side-panel/dialog patterns.
- **Rejected — map-first supply-chain UI:** a map could look impressive but would obscure the privacy and evidence proof under geography.
- **Rejected — raw ledger explorer as primary UI:** useful for developers, but it would make the product feel like infrastructure instead of a custody workflow.
- **Rejected — separate apps per role:** it would hide the privacy contrast; switching roles inside the same shell makes the visibility difference obvious.

## Key Flows

### Flow 1 — UJ-1: Origin lot creation (Ana, Origin Cooperative operator, start of demo)

1. Ana opens the dashboard as Origin Cooperative.
2. Demo stepper highlights "Origin lot."
3. Ana opens Create lot.
4. Selects Coffee beans or Cacao, quantity, tons, origin identifier/coordinates, grade, and certification labels.
5. Adds optional origin certificate evidence.
6. Reviews lot summary.
7. Ana confirms creation.
8. **Climax:** The new lot appears in Origin Cooperative holdings, with a privacy callout stating it is visible only to entitled parties.

Failure: missing quantity/certification → inline field error; no lot is created.

### Flow 2 — UJ-2: Custody transfer with evidence (Bruno, logistics operator receiving truck custody)

1. Demo operator switches to Origin Cooperative.
2. Opens Transfer Assets.
3. Selects a visible certified lot.
4. Enters a partial quantity destined for Andes Freight Logistics.
5. Adds transport sheet or receipt evidence; file is hashed.
6. Reviews transfer summary with origin fingerprint and attached document count.
7. Confirms transfer.
8. Demo operator switches to Bruno's Andes Freight Logistics party view.
9. **Climax:** The truck party sees the received holding and transfer history, while unrelated parties still cannot see the lot.

Failure: quantity exceeds source holding → confirm disabled with quantity-conservation explanation.

### Flow 3 — UJ-3: Storage split/combine and outbound movement (Clara, storage operator consolidating custody)

1. Demo operator switches to Clara's Silo Storage Co. party view.
2. Dashboard shows inbound lots received from truck transport.
3. Clara selects compatible lots or receives a partial transfer that aggregates with an existing compatible holding.
4. Split/combine indicator explains source quantities, resulting quantity, certification compatibility, and conserved total.
5. Clara transfers outbound quantity to Pacific Rail Logistics.
6. **Climax:** Silo holdings reduce, rail holdings increase, and asset detail explains how provenance is preserved instead of silently changing balances.

Failure: certification mismatch → combine action is blocked with explicit compatibility copy.

### Flow 4 — UJ-4: Destination-port attestation and verifier view (Mateo, destination-port operator preparing proof)

1. Demo operator switches to Mateo's Rotterdam Port Terminal party view.
2. Opens asset detail for a received shipment.
3. Attestation panel summarizes commodity, selected quantity, custody path, certifications, evidence cards, issuer, recipient, timestamp, and verification status.
4. Mateo generates attestation.
5. Opens verifier panel.
6. **Climax:** Verifier sees the custody-chain proof and document hashes without seeing unrelated holdings or private transfers.

Failure: custody chain incomplete or evidence missing → panel shows warning and the missing step; verifier still displays only validated fields.

### Flow 5 — UJ-5: Non-involved company privacy proof (Vera, unrelated company representative during judge demo)

1. Demo operator switches to Vera's non-involved company party.
2. Dashboard stays in the same shell so the comparison is obvious.
3. Assets tab shows empty privacy state, not generic missing data.
4. History tab shows no transfers.
5. Attempting to open a known asset detail shows the unauthorized privacy gate.
6. **Climax:** Judge sees that the same supply-chain flow exists for involved parties, but the unrelated company sees no private contracts, holdings, transfers, evidence, or attestations.

Failure: if any demo commodity data appears for the non-involved company, the privacy demo fails and should block ship-readiness.

