# Story 3.4: Provenance Timeline and Anti-Double-Spend Checks

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a demo operator,
I want to see provenance and conservation checks across split, combine, and transfer operations,
so that judges can trust that certified quantities are not reused or silently mutated.

**Requirements Covered:** FR8, FR9, FR10, FR14, FR16

## Acceptance Criteria

1. Given a Lot Position has split, combine, or multi-leg custody history, when the user opens asset detail, then the UI shows a provenance timeline or structured custody path, and each step identifies operation type, parties, quantity, and source/derived references.
2. Given a custody operation changes quantity, when the operation completes, then the system records enough data to prove before quantity, after quantity, and conserved total, and the UI surfaces the conservation result where it matters for demo understanding.
3. Given a certified source quantity has been consumed, archived, or allocated, when an operation attempts to reuse the same consumed source quantity beyond its remaining balance, then the operation is rejected, and a test or scripted demo can show the failed double-spend attempt.
4. Given anti-double-spend is represented in this story, when implementation scopes the UI, then the required UI is limited to a clear failed-operation status or warning, and any full graph visualization is out of scope unless explicitly split into a later story.
5. Given provenance data includes private party activity, when an entitled party views the timeline, then only custody details visible to that Party View are shown, and private records belonging only to other parties are not exposed.
6. Given the provenance timeline is used by attestation generation, when the destination-port operator requests an attestation, then the attestation workflow can read source references, split/combine references, custody path, and evidence bindings without rewriting prior state.

## Tasks / Subtasks

- [x] Build a provenance timeline model: extend/reuse `buildCustodyPath` (from Story 3.3) to emit ordered timeline entries with `operationType` (origin | split | combine | transfer), parties, before/after/conserved quantity, source refs, derived refs, and evidence bindings. Derive purely from `assets` + `transfers` + provenance fields (no new persistence). (AC: 1, 2, 6)
- [x] Add a `ProvenanceTimeline` UI component (e.g. `components/provenance-timeline.tsx`) rendered inside `components/asset-detail-view.tsx`. Each step shows operation type, parties, quantity, conservation result (before → after, conserved total), and source/derived references. Keep it a linear/structured list — NO full graph visualization (out of scope per AC 4). (AC: 1, 2, 4)
- [x] Enforce timeline visibility: filter timeline entries through `lib/provenance.ts` visibility helpers so an entitled party sees only steps it is allowed to see; private steps of other parties are excluded. (AC: 5)
- [x] Add an explicit anti-double-spend guard in `lib/demo/custody-service.ts` shared across split, combine, and transfer: a source quantity cannot be consumed/allocated beyond its remaining (available = quantity − reserved − consumed) balance. Centralize the check (e.g. `assertNoDoubleSpend(state, sourceId, requestedQty)`) and call it from `initiateTransfer` and `combineLots`. Reject with a clear `LedgerError` code. (AC: 3)
- [x] Surface the rejection in the UI as a clear failed-operation status/warning (reuse existing error display in transfer/combine panels). No new heavy UI. (AC: 4)
- [x] Add deterministic double-spend tests: (a) attempt to transfer/split more than remaining after a prior split is rejected; (b) attempt to combine a lot already consumed is rejected; (c) conservation totals recorded correctly. Co-locate in `lib/demo/custody-service.test.ts`. (AC: 2, 3)
- [x] Extend the verification script(s) to script a visible failed double-spend attempt (build on `scripts/verify-custody-transfers.ts` which already attempts a double-spend; ensure the message is demo-clear). (AC: 3)
- [x] Confirm attestation-readiness: the timeline/custody-path data structure exposes source references, split/combine references, custody path, and evidence bindings as a read-only projection (the Epic 4 attestation workflow consumes this without mutating prior state). Document the shape in code comments. (AC: 6)
- [x] Daml parity: confirm the ledger model prevents reusing consumed `LotPosition` quantity (archived contracts cannot be re-exercised); existing `submitMustFail` double-spend case in `daml/Test/TraceabilityTest.daml` (`testDoubleSpendBlocked`) covers this. (AC: 3)
- [x] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm verify:custody-transfers`; zero warnings. (AC: all)

## Dev Notes

### Architecture & patterns (must follow)

- The timeline is a READ-ONLY projection over `assets` + `transfers` + provenance; do not introduce a parallel persistence model. Custody truth stays in Daml/Canton (demo mirror). [Source: architecture.md#Frontend Architecture]
- Conservation + anti-double-spend are hard invariants enforced in the custody service, not just the UI. The UI only displays results. [Source: architecture.md#Cross-Cutting Concerns, #Enforcement Guidelines]
- UI scope is intentionally minimal: structured timeline + failed-operation warning. Full provenance graph is explicitly out of scope. [Source: epic-3 Story 3.4 AC4]
- Visibility: timeline respects Party View entitlements via `lib/provenance.ts`; never expose other parties' private steps. [Source: architecture.md#Authentication & Security]

### Existing patterns to mirror

- `buildCustodyPath` from Story 3.3 is the data backbone — extend it rather than re-deriving provenance. [Source: _bmad-output/implementation-artifacts/3-3-outbound-storage-transfer-across-the-demo-route.md]
- Anti-double-spend foundation already exists: `reservedQuantityForAsset` / `availableQuantityForAsset` in `lib/demo/custody-service.ts` and the double-spend attempt in `scripts/verify-custody-transfers.ts`. Centralize and extend across combine. [Source: lib/demo/custody-service.ts]
- Error display + `LedgerError` codes in `lib/ledger/errors.ts`; reuse `INSUFFICIENT_QUANTITY` or add a dedicated `DOUBLE_SPEND` code with clear copy. [Source: lib/ledger/errors.ts]
- Asset detail integration point is `components/asset-detail-view.tsx` (custody activity + evidence already rendered there). [Source: components/asset-detail-view.tsx]

### Source tree components to touch

- `lib/demo/custody-service.ts` — `assertNoDoubleSpend`; timeline-feeding projection.
- `lib/provenance.ts` — timeline visibility filter (reuse existing helpers).
- `components/provenance-timeline.tsx` (NEW) — structured timeline.
- `components/asset-detail-view.tsx` — mount timeline.
- `lib/ledger/errors.ts` — double-spend error code/copy if added.
- `lib/demo/custody-service.test.ts` — double-spend + conservation tests.
- `scripts/verify-custody-transfers.ts` — demo-clear failed double-spend.
- `daml/Test/TraceabilityTest.daml` — `submitMustFail` double-spend.

### Testing standards

- `vitest` (`pnpm test`) for guard + projection purity. Negative cases must assert rejection, not just absence of success. [Source: lib/ledger/mappers.test.ts]
- Scripted demo via `pnpm verify:custody-transfers` shows the failed attempt clearly. [Source: scripts/verify-custody-transfers.ts]
- Daml `submitMustFail` double-spend in `daml/Test/TraceabilityTest.daml`. [Source: .cursor/rules/daml-dpm.mdc]

### Project Structure Notes

- This is the final Epic 3 story and the bridge to Epic 4 (attestation). Keep the timeline/custody-path projection stable and documented so Epic 4 can read it without changes. [Source: architecture.md#Project Organization]

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-split-combine-multi-leg-storage-operations.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/architecture.md]
- [Source: lib/demo/custody-service.ts]
- [Source: scripts/verify-custody-transfers.ts]
- [Source: _bmad-output/implementation-artifacts/3-3-outbound-storage-transfer-across-the-demo-route.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (Cursor agent)

### Debug Log References

- No failures. `pnpm typecheck`, `pnpm lint`, `pnpm vitest run` (69 tests), and all `verify:*` scripts green. `verify:custody-transfers` now prints `Double-spend blocked as expected [DOUBLE_SPEND]: …` for demo clarity.

### Completion Notes List

- Anti-double-spend is centralized in `assertNoDoubleSpend(asset, transfers, requestedQuantity)` and called from both `initiateTransfer` and `combineLots`. It distinguishes a true double-spend (overspending reserved/in-flight quantity → `DOUBLE_SPEND`) from a plain over-amount (nothing reserved → `INSUFFICIENT_QUANTITY`). Consumed/archived lots simply aren't in the snapshot, so they have no balance to re-spend.
- Added `DOUBLE_SPEND` to `LedgerErrorCode`. UI surfaces it via the existing error display in the transfer/combine panels (no new heavy UI), satisfying AC4's "clear failed-operation status."
- Provenance timeline is a pure, READ-ONLY projection: `buildProvenanceTimeline(asset, snapshot, visibleTransfers?)` extends `buildCustodyPath` with operation classification, per-step conservation arithmetic (`before = moved + remaining`), and source/derived refs. No parallel persistence — Epic 4 attestation can consume it without mutating prior state (AC6).
- Operation classification (documented as a demo heuristic): combine = a lot linking ≥2 source positions that hasn't moved yet; split = an outbound leg whose source node still holds a same-batch remainder; transfer = a full outbound leg; origin = the starting custody.
- Timeline visibility (AC5): the component passes only the party-visible transfers (`partyTransfers`) into `buildProvenanceTimeline`, so a non-involved/other party never sees private steps. The page itself is already gated on asset visibility.
- Graph visualization is intentionally OUT of scope (AC4): the timeline is a linear, structured list.
- Daml parity (AC3) already holds: `testDoubleSpendBlocked` exercises `submitMustFail` on a lot consumed by a prior `InitiateTransfer` (archived contracts cannot be re-exercised).

### File List

- `lib/ledger/errors.ts` — added `DOUBLE_SPEND` error code.
- `lib/demo/custody-service.ts` — added `assertNoDoubleSpend` (centralized guard); refactored `initiateTransfer` and `combineLots` to use it; added `ProvenanceOperationType`, `ProvenanceTimelineEntry`, and `buildProvenanceTimeline` (read-only projection).
- `components/provenance-timeline.tsx` (NEW) — structured linear timeline with operation badges, parties, conservation arithmetic, source refs, and per-step evidence.
- `components/asset-detail-view.tsx` — mounts `ProvenanceTimeline`, scoped to party-visible transfers.
- `lib/demo/custody-service.test.ts` — `assertNoDoubleSpend` (codes, reserved vs over-amount, post-split, combine-reserved) and `buildProvenanceTimeline` (origin, combine, split, transfer) coverage.
- `scripts/verify-custody-transfers.ts` — demo-clear failed double-spend output with the `LedgerError` code/message.

### Change Log

- 2026-06-13: Implemented provenance timeline + centralized anti-double-spend guard. Added `DOUBLE_SPEND` code, `assertNoDoubleSpend`, `buildProvenanceTimeline` read-only projection, `ProvenanceTimeline` UI mounted in asset detail, double-spend + timeline unit coverage, and demo-clear verification output. Typecheck/lint/69 tests/all verify scripts green; Daml double-spend parity confirmed via existing `testDoubleSpendBlocked`.
