# Epic 1: Private Party Dashboard & Origin Lot Creation

Users can switch Party Views, create certified origin lots, see only visible holdings, and understand the Canton privacy model from the first screen.

## Story 1.0: Canton/Daml Project Skeleton and Local Demo Setup

As a developer,
I want the existing Next.js app to have a Daml/Canton project skeleton and documented local commands,
So that custody, provenance, and privacy work can be implemented against the intended Canton source of truth instead of remaining mock-only.

**Requirements Covered:** Architecture handoff, Additional Requirements, NFR9

**Acceptance Criteria:**

**Given** the existing Next.js mockup repository is the frontend foundation
**When** the setup story is implemented
**Then** the app keeps the current `app/`, `components/`, `hooks/`, and `lib/` structure
**And** no new frontend starter is initialized unless the current app becomes unusable.

**Given** Daml/Canton is the custody source of truth
**When** the project skeleton is added
**Then** a `daml/` project area exists with `daml.yaml` and initial contract/test or script placeholders for `LotPosition`, `CustodyTransfer`, `SourceAssetReference`, and `TraceabilityAttestation`
**And** the structure follows the architecture's Daml naming conventions.

**Given** frontend code will need ledger-facing types
**When** the setup story is complete
**Then** the intended generated bindings location is documented or stubbed under `lib/ledger/generated/`
**And** scripts or README notes explain how bindings should be regenerated once Daml contracts compile.

**Given** implementation agents need reproducible local commands
**When** the README or setup documentation is updated
**Then** it includes local prerequisites, Daml/Canton build or test commands, Next.js app commands, and DevNet/LocalNet fallback notes
**And** it clearly states that Supabase and Privy remain optional for the MVP unless later stories enable them.

**Given** current UI/demo state may remain while Canton work is introduced
**When** demo adapters or mock data remain in use
**Then** they are clearly separated from `lib/ledger/` source-of-truth boundaries
**And** no client-side store is treated as authoritative custody quantity.

**Given** the architecture requires anti-double-spend proof
**When** initial ledger tests or scripts are stubbed
**Then** there is a documented path for a negative double-spend attempt that later stories can complete
**And** the missing implementation is tracked explicitly rather than implied.

## Story 1.1: Party View Shell and Privacy-Aware Dashboard

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

## Story 1.2: Non-Involved Company Privacy Proof

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

## Story 1.3: Origin Lot Creation Panel

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

## Story 1.4: Origin Evidence and Certification Metadata

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

## Story 1.5: Guided Demo Copy and UI Foundations

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
