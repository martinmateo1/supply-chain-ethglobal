# Requirements Inventory

## Functional Requirements

FR1: A producer can select a Commodity when creating a Lot Position; the selector includes coffee beans and cacao, the data model remains commodity-generic, and the selected Commodity appears consistently in holdings, transfers, and Attestations.

FR2: A producer can create a Lot Position with Commodity, quantity, unit, origin coordinates or establishment identifier, quality grade, certification metadata, and current Operational Node; created lots appear in the producer Party View and are hidden from unrelated Party Views.

FR3: The system preserves certification metadata from the origin Lot Position through Custody Transfers, splits, and merges, using structured certification labels and retaining metadata in derived positions unless a supported workflow marks it incompatible or removed.

FR4: An authorized sender can initiate a Custody Transfer from a source Operational Node to a destination Operational Node for a selected quantity, with quantity constrained by source availability and destination positions retaining Provenance Links.

FR5: An authorized destination party can accept an inbound Custody Transfer; pending inbound transfers are visible only to relevant destination Party Views, and acceptance creates or updates a destination Lot Position.

FR6: An authorized party can attach Evidence References to a Custody Transfer, including at least document name, document type, hash or content identifier, issuer, and timestamp, with file contents remaining off-ledger or unstored in the MVP.

FR7: The UI shows inbound and outbound Custody Transfers visible to the selected Party View, including visible Evidence References, while non-involved parties cannot see private transfers.

FR8: An authorized party can split a Lot Position into multiple child Lot Positions whose quantities sum to the parent quantity, preserve Commodity, certification metadata, and Provenance Links, and archive, reduce, or otherwise update the parent so total quantity is conserved.

FR9: An authorized storage party can combine compatible Lot Positions into a new Lot Position, with compatibility based on same Commodity plus explicitly selected certification compatibility for the MVP, and with Provenance Links to all source positions.

FR10: An authorized storage party can create an outbound Custody Transfer for a selected quantity from stored inventory, reducing or archiving the relevant storage Lot Position and preserving Provenance Links needed for later Attestation.

FR11: A demo user can switch between preconfigured Party Views for producer, logistics operator, storage operator, port operator, and non-involved company; switching changes visible holdings, transfers, and Attestations.

FR12: The UI shows Lot Positions visible to the active Party View, including producer-originated lots, logistics custody positions, storage and port holdings, and no private demo holdings for unrelated companies.

FR13: The UI includes lightweight explanatory cues that show why a Party View can or cannot see a record, including a clear non-involved empty state explaining that no contracts are visible.

FR14: An authorized party can generate an Attestation for a selected received quantity, including Commodity, quantity, origin metadata, certification metadata, custody path, split/combine references, Evidence References, issuer, recipient, timestamp, and verification status.

FR15: An authorized party can share or present an Attestation to a buyer, auditor, or regulator without exposing unrelated holdings or transfers, represented in the hackathon MVP by an in-app verifier view if public sharing is not built.

FR16: The system shows that Evidence References are bound to Custody Transfers included in an Attestation, listing each Evidence Reference and its supporting transfer while avoiding full third-party document authenticity verification in the MVP.

## NonFunctional Requirements

NFR1: The product must demonstrate that non-involved parties cannot see private Lot Positions, Custody Transfers, Evidence References, or balances.

NFR2: The product must avoid broad observer/signatory modeling that would make private supply-chain data visible to parties who do not need it.

NFR3: Party View switching must make visibility differences clear enough for a judge to understand during a short demo.

NFR4: Quantity changes must conserve quantity across split, combine, transfer, and storage operations.

NFR5: Evidence References must remain linked to the relevant Custody Transfers used in an Attestation.

NFR6: Provenance Links must remain available for Attestation generation after split and combine operations.

NFR7: The MVP UI should support the full demo flow without requiring command-line steps during judging, except for setup or deployment.

NFR8: The active Party View, selected Commodity, current holdings, and transfer status must be obvious on screen.

NFR9: The MVP must be deployable or demoable with a README that covers setup, privacy model, architecture overview, known limitations, and demo script.

NFR10: The product should prioritize a crisp Canton privacy demo over broad supply-chain platform completeness.

## Additional Requirements

- Use the existing Next.js mockup as the frontend foundation and do not initialize a new frontend starter unless the current app becomes unusable.
- Preserve the current stack direction: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui primitives, Zustand for UI/demo state, and Daml/Canton for custody truth.
- Add a Daml/Canton project skeleton around the existing frontend, using Canton `cn-quickstart` and Daml SDK patterns as references without adopting the Java backend as the primary architecture.
- Daml/Canton must be the source of truth for custody, provenance, quantity conservation, certified-quantity single-use, and Attestation-relevant state.
- Supabase, if used, is limited to off-ledger Evidence Reference metadata, file references, or app convenience state and must not store authoritative custody quantity.
- Each wallet-like Operational Node is modeled as a Canton party; Companies can group multiple Operational Nodes for app metadata.
- Every custody-holding leg is an Operational Node: truck transport, silo storage, railway transport, origin port, ship custody, and destination port receipt.
- A thin Next.js server/API layer must mediate ledger commands and queries; browser components must not submit raw Canton commands or manage ledger command construction directly.
- MVP auth uses a demo Party View switcher; Privy is deferred unless time remains and it improves onboarding without weakening the Canton MVP.
- API routes should be action-oriented, using routes such as `/api/ledger/create-lot`, `/api/ledger/initiate-transfer`, `/api/ledger/accept-transfer`, `/api/ledger/generate-attestation`, and `/api/ledger/verify-double-spend`.
- API responses should use a consistent `ApiResponse<T>` envelope with `{ ok: true, data }` or `{ ok: false, error }`.
- Client state stores UI/demo state only, such as active Party View, selected Commodity, filters, selected Lot Position, and transient form state; ledger-derived holdings, transfers, and Attestations are fetched through the gateway.
- Project structure should keep UI under `app/`, `components/`, and `hooks/`; put Daml contracts under `daml/`; ledger utilities under `lib/ledger/`; domain helpers under `lib/domain/`; optional evidence/Supabase utilities under `lib/evidence/` and `lib/supabase/`.
- Use PRD glossary terms in new domain code: `LotPosition`, `CustodyTransfer`, `EvidenceReference`, `SourceAssetReference`, `TraceabilityAttestation`, `Commodity`, `Company`, `OperationalNode`, `PartyView`, and `ProvenanceLink`.
- Avoid new ambiguous domain synonyms such as using `Asset`, `Batch`, and `Lot` interchangeably; if current mockup terms remain, map them clearly to glossary terms.
- Include quantity conservation and provenance continuity checks in Daml contract tests, integration tests, or scripts.
- Include a negative test or scripted demo showing that an already-consumed certified source quantity cannot be reused for another downstream claim.
- Target Next.js on local/Vercel plus Canton DevNet or LocalNet for ledger, with LocalNet as a fallback demo environment and optional Supabase disabled unless needed.
- Use Node.js 20+ as the app runtime baseline.
- The README must document local setup, Canton privacy model, architecture overview, known limitations, and a judge-friendly demo script.
- Current UI development context: the app currently has two routes (`/` and `/assets/[id]`) with a party-scoped dashboard, assets/history tabs, fixed party switcher, transfer side panel, certificate hashing dropzone, asset detail privacy gate, evidence reference display, and static attestation preview.
- Current UI development context: runtime state is seeded and persisted with Zustand/localStorage; there is no API route layer, Canton integration, Supabase integration, auth/session layer, or network data source in the current UI.
- Current UI development context: partial transfer and destination merge behavior exists in the local store but is silent in the UI; future work must make split/combine, provenance, and conservation visible.
- Current UI development context: seeded accounts cover production site, truck, silo, railway, origin port, ship, and destination port, but there is no non-involved company Party View.
- Current UI development context: `TransferModal` and `AccountList` are unused duplicate/superseded components and should not drive future story design unless intentionally revived.
- Current UI development context: `ASSET_IMAGES` references `/assets/*.png`, but `public/` is currently empty, so public commodity images need to be supplied or the UI should use resilient fallbacks.

## UX Design Requirements

UX-DR1: Preserve the current desktop-first single-dashboard information architecture, with the main dashboard at `/`, a transfer side panel, a fixed party switcher, and an asset detail route at `/assets/[id]`.

UX-DR2: Keep mutating workflows such as create lot, transfer, split/combine, and attestation generation in side panels or contextual panels rather than replacing the app with unrelated full-page flows.

UX-DR3: Add a production-site-only create lot panel that captures commodity, quantity, unit, origin identifier or coordinates, quality grade, certifications, and optional origin evidence.

UX-DR4: Add a compact guided demo stepper or callout layer showing the custody route: Origin lot, Truck, Silo, Rail, Origin port, Ship, Destination port, Attestation, and Privacy check.

UX-DR5: Make the active Party View and company role visible at all times, including while side panels are open.

UX-DR6: Add privacy callouts on the dashboard, asset detail, verifier panel, and non-involved empty states explaining why records are visible or hidden.

UX-DR7: Replace generic empty states for the non-involved company with a strong privacy proof state that states no private contracts, holdings, transfers, evidence, or attestations are visible.

UX-DR8: Ensure Party View switching immediately changes holdings, history, asset visibility, and privacy explanations.

UX-DR9: Show only holdings visible to the active Party View; if no holdings are visible because of Canton privacy, communicate that this is intentional rather than missing data.

UX-DR10: Keep the existing transfer panel compact, with sender, asset, quantity, destination, evidence upload, review summary, and confirmation in one side panel.

UX-DR11: Keep evidence upload keyboard-operable, support PDF/image/Word files, hash files client-side, show readable document cards, and keep errors inline.

UX-DR12: Disable transfer confirmation and show an inline quantity-conservation explanation when transfer quantity exceeds available lot quantity.

UX-DR13: Add explicit split/combine indicators on asset rows, dashboard context, and asset detail when partial transfers or compatible aggregations occur.

UX-DR14: Split/combine explanations must show before quantity, after quantity, source or derived references, certification compatibility, and conserved total when the implementation supports them.

UX-DR15: Add pending inbound transfers as a distinct history/dashboard state with Accept/Reject actions if FR-5 is implemented; otherwise document immediate confirmation as an MVP shortcut and avoid implying FR-5 is complete.

UX-DR16: Promote the static asset-detail attestation preview into a real attestation panel for destination-port assets or authorized received quantities.

UX-DR17: The attestation panel must summarize commodity, selected quantity, custody path, certifications, evidence cards, issuer, recipient, timestamp, and verification status.

UX-DR18: Show attestation unavailable or warning states when the custody chain is incomplete or evidence is missing, listing missing custody steps rather than silently succeeding.

UX-DR19: Add a read-only in-app verifier panel that shows exactly what a buyer/auditor can verify without exposing full holdings, unrelated balances, or unrelated private transfers.

UX-DR20: Make document hashes visible in evidence cards and verifier views using mono typography, but present human document meaning before raw hashes.

UX-DR21: Use a narrow product color system on top of shadcn tokens: custody yellow for custody progression and primary actions, privacy blue for Canton visibility and verifier status, evidence green for document references and hashes, warning amber for conservation/incomplete-attestation warnings, and commodity browns only for commodity metadata.

UX-DR22: Reuse Inter for UI typography and Geist Mono only for asset IDs, record IDs, origin fingerprints, hashes, and contract-like references.

UX-DR23: Preserve the current layout density, rounded scale, neutral panels, compact list rows, and restrained motion; avoid map-first UIs, animated blockchain diagrams, heavy card stacks, glassmorphism, and broad ledger explorer views as primary UI.

UX-DR24: Meet a WCAG 2.2 AA accessibility floor for dashboard, panels, and verifier, including visible focus rings, logical focus order, keyboard-operable upload target, and reduced-motion handling for side-panel transitions.

UX-DR25: Ensure hashes are selectable or copyable in the final implementation.

UX-DR26: Prioritize desktop web for hackathon judging; keep tablet usable where practical, but do not optimize the MVP around mobile field operations.

UX-DR27: Use operator-language microcopy, such as "Only involved custodians can see this lot" and "No private contracts are visible to this company," instead of generic permission or no-data messages.

UX-DR28: Keep company roles visible in the UI while retaining PRD protagonist names only in flow documentation for traceability.

UX-DR29: Add or replace missing public commodity image assets referenced by the current UI, or provide resilient fallbacks so asset rows and transfer rows do not show broken images.

UX-DR30: Keep the app as a guided proof surface for a sub-five-minute judge demo; UX polish should serve the Canton privacy thesis rather than broaden the product into a general ERP.

## FR Coverage Map

FR1: Epic 1 - Commodity selection for origin lots.

FR2: Epic 1 - Origin Lot Position creation.

FR3: Epic 1 - Certification metadata preservation starts at origination and continues as a cross-epic invariant.

FR4: Epic 2 - Custody Transfer initiation.

FR5: Epic 2 - Inbound transfer acceptance.

FR6: Epic 2 - Evidence Reference attachment.

FR7: Epic 2 - Visible transfer history.

FR8: Epic 3 - Lot splitting.

FR9: Epic 3 - Compatible lot combining.

FR10: Epic 3 - Storage outbound transfer.

FR11: Epic 1 - Party View switching.

FR12: Epic 1 - Visible holdings by Party View.

FR13: Epic 1 - Visibility explanation cues.

FR14: Epic 4 - Attestation generation.

FR15: Epic 4 - Selective attestation sharing/presentation.

FR16: Epic 4 - Evidence binding verification.
