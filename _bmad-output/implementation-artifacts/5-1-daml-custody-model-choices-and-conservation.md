---
baseline_commit: 602165419bb2ae679c6ca6c7eeb66db22afb557c
---

# Story 5.1: Daml Custody Model — Choices and Conservation

Status: ready-for-dev

## Story

As a Daml/ledger developer,
I want `LotPosition` and `CustodyTransfer` to expose real choices with quantity conservation and anti-double-spend,
so that custody state transitions are authorized and enforced on-ledger instead of in the browser.

## Acceptance Criteria

1. Given the current skeleton templates have no choices, when the Daml model is implemented, then `LotPosition` exposes a choice supporting custody movement (reduce/split out a transferred quantity) preserving `commodity`, `certifications`, `quality`, and origin provenance, and total quantity is conserved across the transfer (none created or destroyed).
2. Given a sender holds a `LotPosition`, when `InitiateTransfer` is exercised for a quantity ≤ available, then a pending `CustodyTransfer` is created with `sender`, `receiver`, `quantity`, evidence references, source provenance, and `Pending` status, and the reserved quantity cannot be spent again while pending (anti-double-spend enforced on-ledger).
3. Given a pending `CustodyTransfer` targets a receiver, when the receiver exercises `AcceptTransfer`, then a destination `LotPosition` is created or updated for the receiver and the source is reduced/archived accordingly, and only the `receiver` is authorized to accept.
4. Given a pending `CustodyTransfer`, when the receiver exercises `RejectTransfer`, then custody does not move and the reserved source quantity is released, and the transfer ends in `Rejected` status.
5. Given the Daml model compiles, when `dpm build` and the Daml Script tests run, then a happy-path script and a failing double-spend attempt are both covered, and the double-spend attempt fails as a negative assertion rather than silently passing.

## Tasks / Subtasks

- [ ] Extend `daml/Commodity/Types.daml` if needed for evidence reference / provenance fields used by transfers. (AC: 1, 2)
- [ ] Implement `LotPosition` custody-movement choice(s): split/reduce a quantity while preserving metadata and conserving total. (AC: 1)
  - [ ] Decide custody model: reserve-on-initiate vs. split-on-accept. Document the choice in Dev Notes (reserve-on-initiate is recommended so double-spend is blocked while pending).
- [ ] Implement `CustodyTransfer` choices `InitiateTransfer`, `AcceptTransfer`, `RejectTransfer` with correct signatory/controller authorization (sender initiates; receiver accepts/rejects). (AC: 2, 3, 4)
- [ ] Bind evidence references and source provenance onto the transfer so later attestation work can read them. (AC: 2)
- [ ] Write `daml/Test/TraceabilityTest.daml` Daml Script tests: happy-path (create → initiate → accept) and a `submitMustFail` double-spend attempt. (AC: 5)
- [ ] Build and test with `dpm`. (AC: 5)

## Dev Notes

### Current State (verified)

- `daml.yaml` is at the **repo root** (not in `daml/`): `sdk-version: 3.5.1`, `name: commodity-traceability`, `source: daml`, deps `daml-prim`, `daml-stdlib`, `daml-script`.
- `daml/Commodity/LotPosition.daml` — template with `owner, commodity, quantity, certifications, quality`; `signatory owner`; **no choices**.
- `daml/Commodity/CustodyTransfer.daml` — template with `sender, receiver, quantity, status (Pending|Completed|Rejected)`; `signatory sender`, `observer receiver`; **no choices**.
- `daml/Commodity/Types.daml` — `CommodityKind (Coffee|Cacao)`, `Certification (NonGMO|DeforestationFree)`, `QualityGrade (GradeA|GradeB|GradeC)`, `Quantity {amount: Decimal, unit: Text}`, plus `CompanyId`/`OperationalNodeId`/`PartyViewId` newtypes.
- `daml/Scripts/SetupDemo.daml` and `daml/Test/TraceabilityTest.daml` are empty placeholders.
- `dpm build` currently **succeeds** and emits `.daml/dist/commodity-traceability-0.0.1.dar` (verified). It warns that templates depend on `daml-script`; acceptable for the hackathon, but consider splitting scripts into their own package later (`-Wno-template-interface-depends-on-daml-script` to silence).

### Toolchain (Canton via dpm)

- `dpm build` — compile to DAR.
- `dpm script` / `dpm test` — run Daml Script declarations (use for AC 5 tests).
- `dpm sandbox` — full Canton in a single process (used by Story 5.2).
- `dpm codegen-js` — TS bindings (used by Story 5.2).

### Architecture Guardrails

- Daml/Canton owns custody, provenance, quantity conservation, certified-quantity single-use. Do **not** add broad observers to simplify the demo — privacy leaks across Party Views are blockers (`architecture.md` §Party visibility).
- Operational Node = Canton party (`architecture.md` decision). Keep authorization in Daml choices/controllers, not in app code.
- Anti-double-spend must be provable: the reserved quantity must be unavailable for a second transfer while a transfer is pending.

### Custody Model Recommendation

- Prefer **reserve-on-initiate**: `InitiateTransfer` consumes the source `LotPosition` and produces (a) a pending `CustodyTransfer` carrying the moved quantity and (b) a remainder `LotPosition` for the sender. `AcceptTransfer` then mints the receiver's `LotPosition`; `RejectTransfer` returns the quantity to the sender. This makes double-spend structurally impossible (the reserved quantity is no longer in a spendable `LotPosition`).

### Testing Requirements

- `dpm build` must pass.
- Daml Script: one happy-path scenario and one `submitMustFail` double-spend assertion (AC 5).
- This story is Daml-only; no `pnpm` changes expected. If TS types are touched, run `pnpm lint` and `pnpm typecheck`.

### References

- `_bmad-output/planning-artifacts/epics/epic-5-canton-ledger-integration.md`
- `_bmad-output/planning-artifacts/architecture.md` (custody source of truth; party model; anti-double-spend)
- `daml/Commodity/*.daml`, `daml/Test/TraceabilityTest.daml`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
