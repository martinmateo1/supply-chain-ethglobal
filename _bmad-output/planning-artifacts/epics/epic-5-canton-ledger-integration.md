# Epic 5: Canton Ledger Integration (Vertical Slice)

Replace the client-side demo custody adapter with a Canton/Daml-backed source of truth, so custody, provenance, and selective visibility are enforced by the ledger rather than by browser state. Delivered as a thin vertical slice that proves the end-to-end path (create lot → initiate transfer → accept/reject) on a local Canton ledger before broadening to Epics 3 and 4.

**Architecture decisions covered:** Daml/Canton as custody source of truth, Operational Node = Canton party, server-side gateway mediates all ledger commands/queries, ledger-derived data is authoritative (client holds UI/demo state only).

**Requirements hardened:** FR1, FR2, FR3 (privacy/visibility now ledger-enforced), FR4, FR5, FR6, FR7 (custody actions now ledger-backed).

**Toolchain:** Daml SDK `3.5.1` managed via `dpm` (`dpm build`, `dpm sandbox`, `dpm script`, `dpm codegen-js`). `daml.yaml` at repo root, source `daml/`.

**Definition of done for the epic:** With `LEDGER_BACKEND=canton`, a user can create an origin lot, send a transfer with evidence, and have the recipient accept it — all through the existing `/api/ledger/*` gateway — with holdings/history read back from Canton, a passing happy-path script, and a passing double-spend negative test. The demo adapter remains available behind the feature flag as a fallback.

## Story 5.1: Daml Custody Model — Choices and Conservation

As a Daml/ledger developer,
I want `LotPosition` and `CustodyTransfer` to expose real choices with quantity conservation and anti-double-spend,
So that custody state transitions are authorized and enforced on-ledger instead of in the browser.

**Requirements Covered:** FR4, FR5, FR6 (anti-double-spend, conservation)

**Acceptance Criteria:**

**Given** the current skeleton templates have no choices
**When** the Daml model is implemented
**Then** `LotPosition` exposes a choice to support custody movement (e.g. reduce/split out a transferred quantity) preserving `commodity`, `certifications`, `quality`, and origin provenance
**And** total quantity is conserved across the transfer (no quantity created or destroyed).

**Given** a sender holds a `LotPosition`
**When** `InitiateTransfer` is exercised for a quantity ≤ available
**Then** a pending `CustodyTransfer` is created with `sender`, `receiver`, `quantity`, evidence references, source provenance, and `Pending` status
**And** the reserved quantity cannot be spent again while the transfer is pending (anti-double-spend enforced on-ledger).

**Given** a pending `CustodyTransfer` targets a receiver
**When** the receiver exercises `AcceptTransfer`
**Then** a destination `LotPosition` is created or updated for the receiver and the source position is reduced/archived accordingly
**And** only the `receiver` is authorized to accept.

**Given** a pending `CustodyTransfer`
**When** the receiver exercises `RejectTransfer`
**Then** custody does not move and the reserved source quantity is released
**And** the transfer ends in `Rejected` status.

**Given** the Daml model compiles
**When** `dpm build` and `dpm script`/`dpm test` run
**Then** a happy-path script and a failing double-spend attempt are covered by Daml Script tests
**And** the double-spend attempt fails as a negative assertion rather than silently passing.

## Story 5.2: Demo Party Provisioning and LocalNet Bring-Up

As a developer running the demo,
I want `SetupDemo` to allocate the demo parties and seed lots on a local Canton ledger with documented commands,
So that the frontend Party Views map to real Canton parties for the judging demo.

**Requirements Covered:** FR1, FR2, FR3 (party model + visibility)

**Acceptance Criteria:**

**Given** the custody route producer → truck → silo → railway → origin port → ship → destination port
**When** `Scripts/SetupDemo.daml` is implemented
**Then** it allocates one Canton party per Operational Node used in the demo and creates the seed `LotPosition`s aligned with the frontend seed data
**And** party display names map cleanly to the UI Party View switcher labels.

**Given** Canton is installed via `dpm`
**When** the README/setup notes are updated
**Then** they document the exact local commands to build, start a local ledger (`dpm sandbox`), upload the DAR, and run `SetupDemo`
**And** they document the JSON API/ledger endpoint and how party IDs are surfaced to the app.

**Given** the frontend needs typed ledger access
**When** bindings are generated
**Then** `dpm codegen-js` output is produced into `lib/ledger/generated/` (replacing the placeholder) with a documented regeneration command
**And** no hand-maintained contract types drift from the compiled Daml.

**Given** a fresh machine
**When** a developer follows the documented steps
**Then** they reach a running local ledger with allocated parties and seeded lots without undocumented manual steps.

## Story 5.3: Canton-Backed Gateway Adapter Behind a Feature Flag

As a custody operator,
I want the existing `/api/ledger/*` routes to talk to Canton when enabled,
So that custody actions are submitted to the ledger without changing the frontend contract.

**Requirements Covered:** FR4, FR5, FR6, FR7

**Acceptance Criteria:**

**Given** the demo adapter currently serves custody actions
**When** a `LEDGER_BACKEND` feature flag is introduced (`demo` default, `canton` opt-in)
**Then** `LEDGER_BACKEND=canton` routes `initiate-transfer`, `accept-transfer`, `reject-transfer`, and `transfer-history` through `lib/ledger/*` to Canton
**And** `LEDGER_BACKEND=demo` keeps the existing `lib/demo/custody-service.ts` behavior unchanged.

**Given** the Canton client is needed
**When** `lib/ledger/client.ts`, `commands.ts`, and `queries.ts` are implemented
**Then** they submit/query via the Canton JSON API (or chosen driver) using `CANTON_LEDGER_HOST`/`CANTON_LEDGER_ID`
**And** `lib/ledger/mappers.ts` converts ledger payloads to the existing UI domain types and `ApiResponse<T>` envelope.

**Given** an active Party View
**When** a custody action is submitted via the Canton backend
**Then** the gateway maps the Party View to the correct Canton party
**And** unauthorized party/action combinations are rejected by ledger authorization, surfaced as stable `ApiResponse` errors.

**Given** a Canton submission fails (insufficient quantity, unauthorized, contention, ledger unavailable)
**When** the route returns
**Then** the failure is mapped to a stable error code via `lib/ledger/errors.ts`
**And** no private cross-party details leak in the error response.

## Story 5.4: Authoritative Ledger State in the UI (Close AC 2.4.3)

As a custody operator,
I want holdings and transfer history to be read from Canton rather than from a client snapshot,
So that the ledger — not `localStorage` — is the source of truth (closing the deferred Story 2.4 AC 3).

**Requirements Covered:** FR4, FR7 (and architecture authoritative-state decision)

**Acceptance Criteria:**

**Given** the Canton backend is active
**When** the UI loads or refreshes holdings and history
**Then** data is fetched from the Canton-backed gateway and treated as authoritative
**And** the client no longer sends a custody `snapshot` in request bodies for the Canton path.

**Given** the client store currently persists `assets` + `transfers`
**When** the Canton backend is active
**Then** Zustand/`localStorage` retains only UI/demo state (active Party View, filters, transient form data)
**And** custody quantities are never read from client persistence as truth.

**Given** a transfer is accepted by the recipient Party View
**When** the sender and recipient refresh
**Then** both see ledger-consistent holdings and history reflecting the move
**And** an unrelated Party View cannot see the transfer or infer it from totals.

**Given** the epic vertical slice is complete
**When** the happy path (create lot → transfer → accept) and the double-spend negative are exercised end-to-end against Canton
**Then** both behave correctly through the running app
**And** Story 2.4 AC 3 can be marked MET for the Canton path, with the demo adapter retained only as a flagged fallback.
