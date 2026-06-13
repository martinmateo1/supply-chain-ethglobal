---
baseline_commit: 602165419bb2ae679c6ca6c7eeb66db22afb557c
---

# Story 5.1: Daml Custody Model — Choices and Conservation

Status: review

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

- [x] Extend `daml/Commodity/Types.daml` if needed for evidence reference / provenance fields used by transfers. (AC: 1, 2)
- [x] Implement `LotPosition` custody-movement choice(s): split/reduce a quantity while preserving metadata and conserving total. (AC: 1)
  - [x] Decide custody model: reserve-on-initiate. Documented in Dev Notes.
- [x] Implement `CustodyTransfer` choices `InitiateTransfer`, `AcceptTransfer`, `RejectTransfer` with correct signatory/controller authorization (sender initiates; receiver accepts/rejects). (AC: 2, 3, 4)
- [x] Bind evidence references and source provenance onto the transfer so later attestation work can read them. (AC: 2)
- [x] Write `daml/Test/TraceabilityTest.daml` Daml Script tests: happy-path (create → initiate → accept) and a `submitMustFail` double-spend attempt. (AC: 5)
- [x] Build and test with `dpm`. (AC: 5)

## Dev Notes

### Custody Model (implemented)

Reserve-on-initiate: `InitiateTransfer` archives the source `LotPosition`, creates a pending `CustodyTransfer` for the reserved quantity, and optionally a remainder `LotPosition` for the sender. `AcceptTransfer` / `RejectTransfer` are receiver-controlled.

### References

- `_bmad-output/planning-artifacts/epics/epic-5-canton-ledger-integration.md`
- `daml/Commodity/LotPosition.daml`, `daml/Test/TraceabilityTest.daml`

## Dev Agent Record

### Agent Model Used

Composer

### Completion Notes List

- Implemented `LotPosition.InitiateTransfer`, `CustodyTransfer.AcceptTransfer`, `CustodyTransfer.RejectTransfer` with reserve-on-initiate anti-double-spend.
- Added Daml Script tests: happy path, double-spend blocked, reject releases quantity.
- Post-review hardening (party-mode): the double-spend test no longer conflates "insufficient quantity" with "consumed lot" — it now spends the remainder successfully, then proves the archived original cannot be re-spent. Added guard tests: `testCannotAcceptTwice`, `testCannotAcceptAfterReject`, `testTransferAmountMustBePositive`. All 7 scripts pass under `dpm test`.
- `dpm build` and `dpm test` pass (use `JAVA_HOME` for Temurin 17).

### File List

- daml/Commodity/LotPosition.daml
- daml/Test/TraceabilityTest.daml
- daml/Commodity/CustodyTransfer.daml (deleted — merged into LotPosition.daml)

### Change Log

- 2026-06-13: Daml custody model with conservation, evidence hashes, and negative double-spend tests.
- 2026-06-13: Party-mode review — strengthened double-spend test semantics; added accept-twice, accept-after-reject, and positive-amount guard tests.
