---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-hackaton-2026-06-12/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-hackaton-2026-06-13/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-hackaton-2026-06-13/EXPERIENCE.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-hackaton-2026-06-13/existing-screen-audit.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-hackaton-2026-06-13/.decision-log.md"
  - "package.json"
  - "components.json"
  - "app/layout.tsx"
  - "app/page.tsx"
  - "app/assets/[id]/page.tsx"
  - "app/globals.css"
  - "components/traceability-view.tsx"
  - "components/assets-panel.tsx"
  - "components/history-panel.tsx"
  - "components/transfer-panel.tsx"
  - "components/certificate-dropzone.tsx"
  - "components/asset-detail-view.tsx"
  - "components/asset-row.tsx"
  - "components/transfer-row.tsx"
  - "lib/store.ts"
  - "lib/types.ts"
  - "lib/data.ts"
  - "lib/provenance.ts"
workflowType: "epics-and-stories"
lastStep: 4
status: "complete"
completedAt: "2026-06-13"
updatedAt: "2026-06-13"
---

# hackaton - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for hackaton, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

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

### NonFunctional Requirements

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

### Additional Requirements

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

### UX Design Requirements

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

### FR Coverage Map

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

## Epic List

### Epic 1: Private Party Dashboard & Origin Lot Creation

Users can switch Party Views, create certified origin lots, see only visible holdings, and understand the Canton privacy model from the first screen.

**FRs covered:** FR1, FR2, FR3, FR11, FR12, FR13

### Epic 2: Evidence-Backed Custody Transfer

Supply-chain operators can initiate, review, accept, and inspect custody transfers with evidence references bound to each movement.

**FRs covered:** FR4, FR5, FR6, FR7

### Epic 3: Split, Combine & Multi-Leg Storage Operations

Storage and logistics operators can split, combine, conserve, and move quantities across the full custody route while preserving provenance.

**FRs covered:** FR8, FR9, FR10

### Epic 4: Selective Attestation & Verifier Proof

Authorized destination or port users can generate and present a selective custody-chain attestation without exposing unrelated private ledger data.

**FRs covered:** FR14, FR15, FR16

## Epic 1: Private Party Dashboard & Origin Lot Creation

Users can switch Party Views, create certified origin lots, see only visible holdings, and understand the Canton privacy model from the first screen.

### Story 1.1: Party View Shell and Privacy-Aware Dashboard

As a demo operator,
I want to switch between preconfigured company Party Views in the existing dashboard,
So that I can show that each company sees only its own relevant commodity holdings and custody activity.

**Requirements Covered:** FR11, FR12, FR13

**Acceptance Criteria:**

**Given** the dashboard is open at `/`
**When** the user views the active Party View selector
**Then** the selector displays the active company role, operational node name, and visible total quantity
**And** the selected Party View remains visible while dashboard panels are open.

**Given** multiple preconfigured Party Views exist for the custody route
**When** the user switches Party View
**Then** the dashboard updates visible holdings and transfer history for the selected party
**And** the UI does not expose holdings or transfers that are unrelated to that party.

**Given** the deterministic demo fixture includes an origin producer, sender, receiver, current custodian, prior custodian, verifier, and non-involved company
**When** the fixture is loaded
**Then** each Party View has an expected visibility matrix for holdings, transfers, evidence, and attestations
**And** the dashboard behavior can be verified against that matrix.

**Given** the active party has visible Lot Positions
**When** the user opens the Assets tab
**Then** the holdings list shows commodity, quantity, unit, quality grade, certification labels, and detail navigation for each visible Lot Position
**And** the UI uses glossary-aligned copy or clearly maps existing "asset" language to Lot Position meaning.

**Given** the active party has visible custody activity
**When** the user opens the History tab
**Then** the dashboard shows sent and received Custody Transfers visible to that Party View
**And** each row identifies counterparty, commodity, quantity, date, certification labels, and evidence count when available.

**Given** the active Party View changes
**When** the dashboard rerenders
**Then** the active Party View, holdings, transfer history, and privacy explanation are consistent with the selected party
**And** no client-side cached state leaks a previous party's private records.

**Given** the app is used in a short judge demo
**When** the user lands on the dashboard
**Then** the screen clearly communicates that visibility is party-based Canton selective visibility
**And** the dashboard remains desktop-first, consistent with the existing Next.js/shadcn UI shell.

### Story 1.2: Non-Involved Company Privacy Proof

As a demo operator,
I want to switch to a non-involved company Party View,
So that I can prove unrelated parties cannot see private commodity holdings, custody transfers, evidence, or attestations.

**Requirements Covered:** FR11, FR12, FR13

**Acceptance Criteria:**

**Given** the demo Party Views are available
**When** the user opens the Party View selector
**Then** a non-involved company Party View is available
**And** it is clearly labeled as unrelated to the active custody route.

**Given** the non-involved company Party View is selected
**When** the user opens the Assets tab
**Then** the dashboard shows a privacy proof empty state instead of generic "no assets" copy
**And** the empty state explains that no private Lot Positions are visible to this company.

**Given** the non-involved company Party View is selected
**When** the user opens the History tab
**Then** no private Custody Transfers or Evidence References from the custody route are shown
**And** the empty state explains that no private transfer history is visible to unrelated parties.

**Given** the non-involved company Party View is selected
**When** the user attempts to open a known involved-party asset detail URL
**Then** the asset detail route blocks access with a privacy-focused message
**And** the message explains that Canton visibility is limited to involved custodians and counterparties.

**Given** the non-involved company Party View is selected
**When** the dashboard renders visible totals
**Then** the visible commodity quantity for the demo custody route is zero
**And** no previous involved-party holdings remain visible after switching.

**Given** attestations or verifier views exist for the demo custody route
**When** the non-involved company Party View is active
**Then** the unrelated company cannot inspect hidden counterparties, custody-route quantities, private evidence, or attestation details beyond explicitly shared verifier fields
**And** no aggregate or empty-state copy implies hidden private values.

**Given** the privacy proof state is displayed
**When** a judge reviews the screen
**Then** the UI communicates that the empty state is expected selective visibility behavior
**And** it does not imply a loading failure, missing data error, or broken demo.

### Story 1.3: Origin Lot Creation Panel

As a production-site operator,
I want to create a certified commodity Lot Position from the dashboard,
So that the custody chain starts with structured origin, quantity, quality, and certification data.

**Requirements Covered:** FR1, FR2, FR3

**Acceptance Criteria:**

**Given** the active Party View is a production-site Operational Node
**When** the user views the dashboard actions
**Then** a Create Lot action is available
**And** the action opens a side panel consistent with the existing transfer panel pattern.

**Given** the Create Lot panel is open
**When** the user fills the lot form
**Then** the form captures Commodity, quantity, unit, origin identifier or coordinates, quality grade, certification labels, and current Operational Node
**And** coffee beans and cacao are available as seeded Commodity options.

**Given** the user enters invalid lot data
**When** required fields are missing or quantity is not positive
**Then** the Create Lot confirmation is disabled or blocked
**And** inline validation explains what must be corrected.

**Given** the user reviews a valid origin lot form
**When** the user confirms creation
**Then** a new Lot Position is created for the active production-site Party View
**And** the lot appears in that party's holdings with commodity, quantity, unit, grade, and certification metadata.

**Given** an origin Lot Position has been created
**When** another unrelated Party View is selected
**Then** the new lot is not visible to the unrelated party
**And** the non-involved privacy proof state remains accurate.

**Given** the origin lot has structured Commodity and certification metadata
**When** the lot is later used by transfer or attestation workflows
**Then** the metadata is available for preservation through downstream custody events
**And** the implementation does not hard-code behavior to coffee or cacao only.

### Story 1.4: Origin Evidence and Certification Metadata

As a production-site operator,
I want to attach origin evidence and structured certifications while creating a Lot Position,
So that downstream custodians and attestations can reference the origin proof without storing raw private files on-ledger.

**Requirements Covered:** FR3, FR6, FR16

**Acceptance Criteria:**

**Given** the Create Lot panel is open
**When** the user adds origin evidence
**Then** the UI accepts supported document files or metadata references
**And** each evidence item records document name, document type, hash or content identifier, issuer when available, and timestamp.

**Given** an evidence file is selected
**When** the file is processed
**Then** the app computes or records a stable evidence hash/reference before lot creation
**And** the UI shows a readable evidence card with a mono hash/reference preview.

**Given** the user selects certification labels
**When** the origin lot is created
**Then** the selected certifications are stored as structured metadata
**And** the certifications appear consistently in holdings and asset detail views.

**Given** an origin lot has evidence and certification metadata
**When** the lot is transferred, split, combined, or attested later
**Then** the origin metadata remains available for provenance and attestation workflows
**And** certification metadata is not downgraded to free-text-only copy.

**Given** evidence files stay off-ledger in the MVP
**When** lot creation is submitted
**Then** only evidence references, hashes, or content identifiers are bound to custody state
**And** raw document access is not exposed to unrelated Party Views.

### Story 1.5: Guided Demo Copy and UI Foundations

As a demo operator,
I want the dashboard to guide judges through the privacy and custody model,
So that the app reads as a Canton proof surface rather than a generic inventory UI.

**Requirements Covered:** FR11, FR12, FR13

**Acceptance Criteria:**

**Given** the user lands on the dashboard
**When** the guided demo layer is visible
**Then** it shows the route stages Origin lot, Truck, Silo, Rail, Origin port, Ship, Destination port, Attestation, and Privacy check
**And** the current stage or recommended next action is visually clear.

**Given** the UI refers to existing mockup concepts such as assets or accounts
**When** domain-facing copy is shown
**Then** it either uses PRD glossary terms such as Lot Position, Custody Transfer, Operational Node, and Party View
**And** any retained mockup terms are visibly mapped to glossary meaning.

**Given** privacy callouts appear on dashboard and detail surfaces
**When** users read the copy
**Then** the language explains selective visibility in operator terms
**And** avoids generic messages such as "permission denied" or "no data found" for privacy proof states.

**Given** commodity images are referenced by the UI
**When** image assets are missing or unavailable
**Then** the UI renders resilient fallbacks instead of broken images
**And** commodity identity remains clear through labels, icons, or color tokens.

**Given** users navigate with keyboard or reduced-motion preferences
**When** they interact with dashboard controls, side panels, and upload targets
**Then** focus order, focus visibility, and reduced-motion behavior meet the defined accessibility floor
**And** the desktop-first layout remains usable for the hackathon demo.

## Epic 2: Evidence-Backed Custody Transfer

Supply-chain operators can initiate, review, accept, and inspect custody transfers with evidence references bound to each movement.

### Story 2.1: Custody Transfer Request with Evidence

As a sending custody operator,
I want to initiate a Custody Transfer for a selected quantity with supporting evidence,
So that a downstream party can receive a specific commodity quantity with proof bound to the handoff.

**Requirements Covered:** FR4, FR6

**Acceptance Criteria:**

**Given** the active Party View holds at least one visible Lot Position
**When** the user opens the Transfer side panel
**Then** the panel shows sender, selectable source Lot Position, quantity, destination Operational Node, evidence upload/reference, and review summary
**And** the side panel follows the existing dashboard interaction pattern.

**Given** the user selects a source Lot Position
**When** the user enters transfer details
**Then** the transfer records source Operational Node, destination Operational Node, Commodity, quantity, unit, timestamp intent, and source provenance reference
**And** the selected quantity cannot exceed available quantity.

**Given** the user attaches evidence
**When** the transfer request is reviewed
**Then** each Evidence Reference includes document name, document type, hash or content identifier, issuer when available, and timestamp
**And** raw file contents are not treated as ledger custody state.

**Given** the transfer request is valid
**When** the sender confirms
**Then** the system creates a pending Custody Transfer visible to the sender and intended recipient
**And** unrelated Party Views cannot see the pending transfer details or evidence references.

**Given** a transfer request is pending
**When** the sender attempts to spend the same pending quantity again
**Then** the system blocks double-spending of the reserved quantity
**And** the UI explains that the quantity is locked by a pending inbound transfer.

**Given** the transfer submission fails validation or ledger/API processing
**When** the error is displayed
**Then** the user sees an actionable message without private details leaking to unrelated parties
**And** the source Lot Position remains unchanged until the transfer can be accepted.

### Story 2.2: Pending Inbound Transfer Acceptance

As a destination custody operator,
I want to accept or reject pending inbound Custody Transfers,
So that custody only changes hands when the receiving party explicitly acts.

**Requirements Covered:** FR4, FR5

**Acceptance Criteria:**

**Given** a pending Custody Transfer targets the active Party View
**When** the destination operator opens the dashboard or History tab
**Then** the pending inbound transfer is shown in a distinct pending section
**And** the operator can inspect commodity, quantity, sender, destination, evidence count, and source provenance summary.

**Given** a pending transfer is visible to the destination operator
**When** the operator accepts it
**Then** the destination Lot Position is created or updated
**And** the source Lot Position is archived, reduced, or otherwise updated according to the custody model.

**Given** custody state is pending
**When** any party other than the intended destination attempts to accept the transfer
**Then** the action is rejected
**And** only the current custodian can initiate further transfers after acceptance.

**Given** a pending transfer is visible to the destination operator
**When** the operator rejects it
**Then** custody does not move to the destination party
**And** the sender and recipient can see the rejected status only if they are entitled to that transfer.

**Given** an unrelated Party View is active
**When** pending transfers exist between other parties
**Then** the unrelated party cannot see, accept, reject, or infer the pending transfer.

**Given** a transfer has already been accepted or rejected
**When** either party tries to repeat the same action
**Then** the system prevents duplicate state transitions
**And** the UI explains the current transfer status.

**Given** the transfer state is pending, accepted, rejected, or cancelled
**When** the UI renders available actions
**Then** only state-valid actions are enabled
**And** rejected or cancelled transfers do not change destination custody or available source balance.

### Story 2.3: Party-Visible Transfer History and Evidence Cards

As an involved custody operator,
I want to inspect sent and received transfer history with evidence references,
So that I can understand the custody events visible to my Party View.

**Requirements Covered:** FR6, FR7

**Acceptance Criteria:**

**Given** the active Party View has completed transfers
**When** the user opens the History tab
**Then** sent and received transfers are grouped clearly
**And** each transfer row shows counterparty, commodity, quantity, unit, date, status, certification labels, and evidence count.

**Given** a transfer includes Evidence References
**When** the transfer row or related detail view is inspected
**Then** evidence cards show human-readable document meaning before hashes
**And** hashes or content identifiers use mono typography and are selectable or copyable where practical.

**Given** the active Party View is not involved in a transfer
**When** transfer history is rendered
**Then** the transfer and its evidence references are not shown
**And** aggregate totals do not reveal private activity.

**Given** the user opens an asset detail page for a visible Lot Position
**When** related custody activity is listed
**Then** only transfers visible to the selected Party View are displayed
**And** the visibility explanation remains consistent with the dashboard.

**Given** no transfer history is visible
**When** the History tab renders
**Then** the empty state distinguishes between no activity yet and no activity visible because of selective privacy
**And** the copy does not imply a broken data load.

### Story 2.4: Ledger Gateway Boundaries for Custody Actions

As a custody operator,
I want transfer actions to be submitted through a reliable application boundary,
So that custody state changes are authorized, traceable, and not dependent on client-only mutations.

**Requirements Covered:** FR4, FR5, FR6, FR7

**Acceptance Criteria:**

**Given** the user submits a create-transfer, accept-transfer, or reject-transfer action
**When** the app processes the request
**Then** the browser calls a named Next.js gateway action or route rather than constructing raw Canton commands
**And** the response uses the shared success/error envelope.

**Given** a Party View is active
**When** a custody action is submitted
**Then** the gateway maps the UI Party View to the correct Canton party or demo equivalent
**And** unauthorized party/action combinations are rejected.

**Given** custody state is returned to the UI
**When** holdings or transfer history are refreshed
**Then** ledger-derived data is treated as authoritative
**And** client state stores only UI/demo state such as active Party View, filters, and transient form data.

**Given** the gateway returns lot, transfer, evidence, provenance event, or attestation payloads
**When** the UI consumes the response
**Then** the payloads conform to documented data shapes for revealed and hidden fields
**And** client code does not infer private fields from missing or redacted data.

**Given** a transfer action fails because of insufficient quantity, unauthorized party, invalid evidence, or ledger failure
**When** the UI displays the error
**Then** the user sees a stable, actionable error message
**And** no private details from other parties are exposed.

**Given** the current implementation still uses seeded/local demo state
**When** this story is implemented in MVP mode
**Then** the code clearly separates demo adapters from future Canton-backed gateway boundaries
**And** no story depends on broad client-side custody authority as the long-term source of truth.

## Epic 3: Split, Combine & Multi-Leg Storage Operations

Storage and logistics operators can split, combine, conserve, and move quantities across the full custody route while preserving provenance.

### Story 3.1: Partial Transfer Split with Conservation Feedback

As a custody operator,
I want partial transfers to explicitly split Lot Positions,
So that quantity conservation and provenance remain understandable when only part of a holding moves.

**Requirements Covered:** FR8, FR10

**Acceptance Criteria:**

**Given** a source Lot Position has available quantity
**When** the user initiates a transfer for less than the full quantity
**Then** the operation creates a transferred child position and a remaining source position or equivalent ledger state
**And** the child and remaining quantities sum to the original quantity.

**Given** the deterministic split fixture starts with a known source quantity
**When** split tests run
**Then** transferred quantity plus retained quantity equals the source quantity exactly
**And** rounding, unit conversion, or display formatting cannot hide conservation errors.

**Given** a partial transfer is reviewed
**When** the summary is displayed
**Then** the UI labels the operation as a split
**And** shows before quantity, transfer quantity, remaining quantity, and source reference.

**Given** the split transfer is accepted
**When** the destination party views the received holding
**Then** the received Lot Position preserves Commodity, certification metadata, and Provenance Links
**And** unrelated parties cannot see split details unless entitled.

**Given** the user attempts a split with invalid quantity
**When** the requested amount is zero, negative, or greater than available quantity
**Then** the operation is blocked
**And** the UI explains the quantity conservation rule.

**Given** split data is later used for attestation
**When** provenance is read
**Then** the source and derived references remain available
**And** the attestation workflow can distinguish transferred quantity from remaining balance.

### Story 3.2: Compatible Lot Combine at Storage

As a storage operator,
I want to combine compatible received Lot Positions,
So that stored inventory can be aggregated without losing provenance or certification meaning.

**Requirements Covered:** FR9

**Acceptance Criteria:**

**Given** the active Party View is a storage Operational Node
**When** compatible Lot Positions are visible
**Then** the UI offers a combine action or clearly explains automatic compatible aggregation
**And** compatibility is based on same Commodity plus supported certification compatibility rules.

**Given** selected Lot Positions are compatible
**When** the storage operator confirms combine
**Then** a combined Lot Position is created or updated
**And** the combined quantity equals the sum of the source quantities.

**Given** the deterministic combine fixture includes compatible and incompatible lots
**When** combine tests run
**Then** only compatible Commodity and certification combinations can combine
**And** incompatible lots remain separate with their original quantities and provenance intact.

**Given** source Lot Positions are combined
**When** the combined holding is inspected
**Then** the UI shows source references, before quantities, combined quantity, and certification compatibility
**And** Provenance Links to all source positions remain available.

**Given** selected Lot Positions are incompatible
**When** the storage operator attempts to combine them
**Then** the action is blocked
**And** the UI explains which Commodity or certification rule prevents the combine.

**Given** a combined Lot Position is later transferred or attested
**When** downstream workflows read provenance
**Then** all source Lot Positions remain traceable
**And** evidence and certifications are not silently dropped.

### Story 3.3: Outbound Storage Transfer Across the Demo Route

As a storage or logistics operator,
I want to send stored quantities onward through rail, port, ship, and destination-port custody,
So that the demo can show a complete multi-leg custody chain.

**Requirements Covered:** FR4, FR7, FR10

**Acceptance Criteria:**

**Given** a storage, rail, origin-port, ship, or destination-port Party View has visible custody holdings
**When** the operator initiates an outbound transfer
**Then** the destination options reflect the configured custody route where appropriate
**And** the transfer preserves Commodity, quantity, certifications, evidence references, and Provenance Links.

**Given** an outbound transfer is accepted by the destination party
**When** the source and destination holdings update
**Then** source quantity is reduced or archived according to the custody model
**And** destination quantity is created or updated without violating conservation.

**Given** the custody route progresses through multiple Operational Nodes
**When** the user switches Party Views
**Then** each party sees only the holdings and transfers relevant to its custody step
**And** the non-involved company continues to see no private route data.

**Given** evidence is attached to one or more route legs
**When** asset detail or history is inspected
**Then** the evidence remains bound to the transfer leg it supports
**And** later legs do not imply evidence that was never attached.

**Given** the demo operator reaches destination-port custody
**When** the received quantity is inspected
**Then** the Lot Position has enough custody path and provenance context to support attestation availability checks.

### Story 3.4: Provenance Timeline and Anti-Double-Spend Checks

As a demo operator,
I want to see provenance and conservation checks across split, combine, and transfer operations,
So that judges can trust that certified quantities are not reused or silently mutated.

**Requirements Covered:** FR8, FR9, FR10, FR14, FR16

**Acceptance Criteria:**

**Given** a Lot Position has split, combine, or multi-leg custody history
**When** the user opens asset detail
**Then** the UI shows a provenance timeline or structured custody path
**And** each step identifies operation type, parties, quantity, and source/derived references.

**Given** a custody operation changes quantity
**When** the operation completes
**Then** the system records enough data to prove before quantity, after quantity, and conserved total
**And** the UI surfaces the conservation result where it matters for demo understanding.

**Given** a certified source quantity has been consumed, archived, or allocated
**When** an operation attempts to reuse the same consumed source quantity beyond its remaining balance
**Then** the operation is rejected
**And** a test or scripted demo can show the failed double-spend attempt.

**Given** anti-double-spend is represented in this story
**When** implementation scopes the UI
**Then** the required UI is limited to a clear failed-operation status or warning
**And** any full graph visualization is out of scope unless explicitly split into a later story.

**Given** provenance data includes private party activity
**When** an entitled party views the timeline
**Then** only custody details visible to that Party View are shown
**And** private records belonging only to other parties are not exposed.

**Given** the provenance timeline is used by attestation generation
**When** the destination-port operator requests an attestation
**Then** the attestation workflow can read source references, split/combine references, custody path, and evidence bindings without rewriting prior state.

## Epic 4: Selective Attestation & Verifier Proof

Authorized destination or port users can generate and present a selective custody-chain attestation without exposing unrelated private ledger data.

### Story 4.1: Attestation Readiness Panel

As an authorized destination-port operator,
I want to see whether a received quantity is ready for attestation,
So that I know what custody, provenance, or evidence gaps must be resolved before generating proof.

**Requirements Covered:** FR14, FR16

**Acceptance Criteria:**

**Given** the active Party View is authorized for a received destination-port Lot Position
**When** the user opens asset detail
**Then** an Attestation panel is available
**And** it summarizes Commodity, quantity, current node, certifications, custody path status, evidence status, issuer, recipient, and verification readiness.

**Given** the custody chain is incomplete
**When** attestation readiness is evaluated
**Then** the panel explains which custody step, provenance reference, or evidence binding is missing
**And** the generate action is disabled or clearly marked unavailable.

**Given** evidence is missing for a custody step
**When** readiness is displayed
**Then** the panel shows a warning state
**And** the warning does not falsely imply complete evidence verification.

**Given** the active Party View is not authorized for the received quantity
**When** the user attempts to view attestation readiness
**Then** no private attestation details are shown
**And** the privacy message explains selective visibility.

**Given** earlier epics produced lot IDs, provenance references, and evidence records
**When** readiness is computed
**Then** the panel uses those existing data shapes
**And** it does not require rewriting prior custody history to generate proof.

**Given** attestation readiness evaluates a fixture with origin lot, accepted transfers, split/combine references, and evidence bindings
**When** readiness status is produced
**Then** the allowed input shape is constrained to selected quantity, issuer, recipient, visible custody path, provenance references, and evidence references
**And** hidden fields from unrelated parties remain unavailable to the readiness panel.

### Story 4.2: Generate Custody-Chain Attestation

As an authorized port or exporter operator,
I want to generate a custody-chain Attestation for a selected received quantity,
So that I can present product provenance and evidence without exposing the full private ledger.

**Requirements Covered:** FR14, FR15, FR16

**Acceptance Criteria:**

**Given** a received quantity is attestation-ready
**When** the authorized user generates an Attestation
**Then** the Attestation includes Commodity, quantity, origin metadata, certifications, custody path, split/combine references, Evidence References, issuer, recipient, timestamp, and verification status.

**Given** an Attestation is generated
**When** the output payload is stored or rendered
**Then** revealed fields are limited to the selected proof summary, custody path entries, provenance references, evidence hash/reference metadata, issuer, recipient, timestamp, and verification status
**And** hidden fields include unrelated holdings, unrelated balances, unrelated counterparties, raw private files, and broad underlying contract access.

**Given** the selected quantity is less than or equal to available received quantity
**When** the Attestation is generated
**Then** the selected quantity is represented accurately
**And** the system does not allow proof claims beyond the available certified quantity.

**Given** the custody chain includes split or combine operations
**When** the Attestation is generated
**Then** split/combine references are included in the proof summary
**And** source asset references remain traceable.

**Given** the generated Attestation references Evidence References
**When** the user views the Attestation
**Then** each evidence item is listed with the transfer leg it supports
**And** raw private files are not exposed unless separately authorized.

**Given** an unrelated Party View is active
**When** it attempts to access the generated Attestation details
**Then** private proof details are hidden
**And** broad access to underlying contracts is not granted.

### Story 4.3: In-App Verifier View

As a buyer, auditor, or regulator,
I want a read-only verifier view of a generated Attestation,
So that I can validate the selected custody-chain proof without seeing unrelated holdings or transfers.

**Requirements Covered:** FR15, FR16

**Acceptance Criteria:**

**Given** an Attestation has been generated
**When** the authorized user opens the verifier view
**Then** the view shows the Attestation summary, selected quantity, custody path, certifications, evidence hashes/references, issuer, recipient, timestamp, and verification status
**And** it does not show unrelated balances, unrelated holdings, or broad transfer tables.

**Given** the verifier inspects Evidence References
**When** evidence cards are displayed
**Then** each card shows human-readable document meaning first
**And** hash or content identifier values are visible, mono-styled, and selectable or copyable.

**Given** the verifier view is read-only
**When** the verifier interacts with the page
**Then** no custody actions, transfer actions, or ledger mutations are available
**And** the UI clearly distinguishes verifier proof from operator dashboards.

**Given** an Attestation contains warnings or incomplete evidence
**When** the verifier view opens
**Then** warning status is shown with the affected custody step
**And** the view does not claim stronger verification than the data supports.

**Given** the verifier view is used during judging
**When** the demo operator explains the proof
**Then** the page communicates selective disclosure in concise operator language
**And** the verifier can understand the proof without accessing the full app state.

**Given** the verifier payload is loaded
**When** the verifier inspects it
**Then** the payload exposes only fields explicitly allowed by the Attestation output shape
**And** missing, redacted, or unauthorized fields are not backfilled from dashboard state.

### Story 4.4: Evidence Binding and Privacy Verification

As a demo operator,
I want to prove that Attestation evidence is bound to specific custody transfers and remains selectively visible,
So that the final demo validates both traceability and Canton privacy.

**Requirements Covered:** FR13, FR15, FR16

**Acceptance Criteria:**

**Given** an Attestation includes one or more Evidence References
**When** the user inspects the Attestation or verifier view
**Then** each Evidence Reference is mapped to the Custody Transfer it supports
**And** the transfer leg, document metadata, and hash/reference are visible when authorized.

**Given** a custody transfer has no evidence
**When** it appears in an Attestation context
**Then** the UI identifies the missing evidence state
**And** it does not fabricate document hashes or proof status.

**Given** evidence metadata is tampered with or mismatched to a custody transfer
**When** evidence binding is verified
**Then** the verifier detects the mismatch or marks the evidence binding invalid
**And** the UI does not present the affected transfer as fully verified.

**Given** a non-involved Party View is selected
**When** the user attempts to inspect attestation, evidence, or custody details from the private route
**Then** the UI hides private details
**And** displays a privacy explanation consistent with the dashboard proof state.

**Given** involved parties have different visibility into the same commodity chain
**When** the demo operator switches between Party Views and the verifier view
**Then** each surface shows only the records that party or verifier is entitled to see
**And** the selective proof remains coherent without broad ledger visibility.

**Given** the deterministic role visibility matrix covers sender, receiver, current custodian, prior custodian, verifier, and non-involved company
**When** privacy verification is run
**Then** each role sees only the expected holdings, transfers, evidence, provenance, and attestation fields
**And** deviations from the matrix are treated as privacy failures.

**Given** the full demo flow is complete
**When** the judge follows origin lot creation, custody transfer, split/combine or route progression, attestation generation, verifier view, and non-involved privacy proof
**Then** the product demonstrates private commodity traceability end to end
**And** the result supports a sub-five-minute Canton-focused demo.
