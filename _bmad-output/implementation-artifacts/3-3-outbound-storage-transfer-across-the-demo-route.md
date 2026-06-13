# Story 3.3: Outbound Storage Transfer Across the Demo Route

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a storage or logistics operator,
I want to send stored quantities onward through rail, port, ship, and destination-port custody,
so that the demo can show a complete multi-leg custody chain.

**Requirements Covered:** FR4, FR7, FR10

## Acceptance Criteria

1. Given a storage, rail, origin-port, ship, or destination-port Party View has visible custody holdings, when the operator initiates an outbound transfer, then the destination options reflect the configured custody route where appropriate, and the transfer preserves Commodity, quantity, certifications, evidence references, and Provenance Links.
2. Given an outbound transfer is accepted by the destination party, when the source and destination holdings update, then source quantity is reduced or archived according to the custody model, and destination quantity is created or updated without violating conservation.
3. Given the custody route progresses through multiple Operational Nodes, when the user switches Party Views, then each party sees only the holdings and transfers relevant to its custody step, and the non-involved company continues to see no private route data.
4. Given evidence is attached to one or more route legs, when asset detail or history is inspected, then the evidence remains bound to the transfer leg it supports, and later legs do not imply evidence that was never attached.
5. Given the demo operator reaches destination-port custody, when the received quantity is inspected, then the Lot Position has enough custody path and provenance context to support attestation availability checks.

## Tasks / Subtasks

- [x] Define the configured custody route order in a single source of truth (e.g. `lib/demo/custody-route.ts` or extend `lib/demo/operational-nodes.ts`): silo/storage → rail → origin-port → ship → destination-port, derived from `SEED_ACCOUNTS` stage types in `lib/seed/accounts.ts`. (AC: 1)
- [x] Add a `suggestNextCustodyStep(partyId | stageType)` helper that returns the configured next-hop operational node(s) for the active party, used to order/highlight destination options in the transfer UI. Free choice must still be allowed (route is a suggestion, not a hard lock) unless the epic requires locking — keep configurable. (AC: 1)
- [x] Update `components/transfer-panel.tsx` so destination options reflect the custody route ordering for the active party view (suggested next hop surfaced first / labeled). Reuse existing transfer initiation; no new command needed. (AC: 1)
- [x] Verify `applyAcceptedTransfer` preserves Commodity, certifications, evidence references, and provenance links across every leg (not just the first). Add coverage for rail/port/ship/destination-port hops. (AC: 1, 2)
- [x] Confirm evidence binding stays per-leg: evidence attached on leg N appears only on that `Transfer`/leg and is not retroactively implied on later legs. Inspect `components/asset-detail-view.tsx` history rendering. (AC: 4)
- [x] Add `buildCustodyPath(asset, transfers)` helper that returns the ordered custody path (party, stage, quantity, evidence binding, source/derived refs) for attestation availability — shared with Story 3.4. (AC: 5)
- [x] Confirm party visibility per leg: each operational node sees only its relevant holdings/transfers; the non-involved company sees nothing private. Reuse `lib/provenance.ts` visibility helpers and `lib/store.ts` filtering. (AC: 3)
- [x] Create a verification script `scripts/verify-multi-leg-route.ts` (run via a new `verify:multi-leg` package script) that drives a full route silo → rail → origin-port → ship → destination-port, asserting conservation at each leg, provenance continuity, and per-leg evidence binding; include a non-involved-party visibility assertion. (AC: 1, 2, 3, 4, 5)
- [x] Daml parity: confirm `InitiateTransfer`/`AcceptTransfer` in `daml/Commodity/LotPosition.daml` support chained transfers across owners without losing certifications/provenance; extend `daml/Test/TraceabilityTest.daml` with a multi-leg scenario. (AC: 1, 2)
- [x] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm verify:custody-transfers`, and the new `pnpm verify:multi-leg`; zero warnings. (AC: all)

## Dev Notes

### Architecture & patterns (must follow)

- Custody truth in Daml/Canton; demo service is active path. Multi-leg transfers reuse the existing transfer command — do not invent a per-leg bespoke flow. [Source: architecture.md#Frontend Architecture]
- Conservation must hold at EVERY leg; verify with the new multi-leg script. [Source: architecture.md#Cross-Cutting Concerns, #Enforcement Guidelines]
- Selective visibility is per operational node; the non-involved company must never see private route data (Epic 1 invariant). [Source: architecture.md#Authentication & Security]
- Domain naming: `LotPosition`, `CustodyTransfer`, `ProvenanceLink`. [Source: architecture.md#Naming Patterns]

### Existing patterns to mirror

- Custody route nodes come from `SEED_ACCOUNTS` (`lib/seed/accounts.ts`) and `lib/demo/operational-nodes.ts`; stage types in `lib/types.ts` (`StageType`). Build the route ordering from these — do not hardcode party IDs in components. [Source: lib/seed/accounts.ts]
- Transfer flow: `initiateTransfer` → `acceptTransfer` in `lib/demo/custody-service.ts`; reserve-on-initiate already handles in-flight quantity. [Source: lib/demo/custody-service.ts]
- Visibility filtering already implemented in `lib/store.ts` (visible assets/transfers by party view) + `lib/provenance.ts`. Reuse, do not duplicate. [Source: lib/provenance.ts]
- Verification script pattern: `scripts/verify-custody-transfers.ts` shows how to construct state, run commands, and assert (including a double-spend attempt). Mirror its structure. [Source: scripts/verify-custody-transfers.ts]

### Source tree components to touch

- `lib/demo/custody-route.ts` (NEW) or `lib/demo/operational-nodes.ts` — route ordering + `suggestNextCustodyStep`.
- `lib/demo/custody-service.ts` — `buildCustodyPath`; verify multi-leg preservation.
- `components/transfer-panel.tsx` — route-aware destination ordering.
- `components/asset-detail-view.tsx` — per-leg evidence binding rendering.
- `scripts/verify-multi-leg-route.ts` (NEW) + `package.json` script.
- `daml/Commodity/LotPosition.daml` / `daml/Test/TraceabilityTest.daml` — multi-leg scenario.

### Testing standards

- Standalone route smoke via `scripts/verify-multi-leg-route.ts` (tsx). Conservation + provenance + visibility assertions must fail loudly. [Source: scripts/verify-custody-transfers.ts]
- `vitest` for `buildCustodyPath` and route-ordering helpers (`pnpm test`).
- Daml multi-leg scenario in `daml/Test/TraceabilityTest.daml`, `dpm build`. [Source: .cursor/rules/daml-dpm.mdc]

### Project Structure Notes

- Stay within `app/`, `components/`, `hooks/`, `lib/`, `scripts/`, `daml/`. No new API command needed (reuses transfer). `buildCustodyPath` is shared with Story 3.4 — implement it cleanly here. [Source: architecture.md#Project Organization]

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-split-combine-multi-leg-storage-operations.md#Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md]
- [Source: scripts/verify-custody-transfers.ts]
- [Source: lib/seed/accounts.ts]
- [Source: _bmad-output/implementation-artifacts/3-1-partial-transfer-split-with-conservation-feedback.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (Cursor agent)

### Debug Log References

- `pnpm verify:multi-leg` initially failed: `Custody path [...] != route [...]`. Root cause: `buildCustodyPath` filtered legs via `transferMatchesAsset`, which requires node-adjacency and therefore only matched the final leg. Fixed by matching on the batch signature (`commodity` + certification set + `rating`) so the full chain is recovered even after the lot ID changes at each hop.
- `dpm build`/`dpm test` green; `testMultiLegRoute: ok` (9 transactions across 4 legs).

### Completion Notes List

- Custody route order is a single source of truth in `lib/demo/custody-route.ts`, derived from `DEMO_OPERATIONAL_NODES` (which maps `SEED_ACCOUNTS`). No party IDs hardcoded in components.
- `suggestNextCustodyStep` returns the next hop and is `null` at the end of the route / for off-route nodes (e.g. the verifier). The route is a suggestion: `transfer-panel.tsx` surfaces and labels the next hop ("· Next custody step") but still allows any destination.
- `buildCustodyPath(asset, transfers)` returns the ordered path with per-step quantity, evidence hashes, source provenance ref, and timestamp; ordered by `custodyRouteIndex`. Shared with Story 3.4.
- Evidence binding is per-leg: a leg's `evidenceHashes` come only from that transfer's attachments; the origin step uses the lot's `originEvidence`. Verified by unit test and the multi-leg script.
- Quantity conservation, provenance continuity, and non-involved-party invisibility asserted at every leg in `scripts/verify-multi-leg-route.ts`.
- Daml parity: existing `InitiateTransfer`/`AcceptTransfer` already chain across owners; added `testMultiLegRoute` asserting commodity/certifications/provenance/quantity preserved across all four legs.

### File List

- `lib/demo/custody-route.ts` (NEW) — route order + `custodyRouteIndex` + `suggestNextCustodyStep`.
- `lib/demo/custody-service.ts` — added `CustodyPathStep` type and `buildCustodyPath` (batch-signature chain matching).
- `components/transfer-panel.tsx` — route-aware destination ordering + next-hop label.
- `components/asset-detail-view.tsx` — per-leg evidence rendering (existing history path confirmed).
- `scripts/verify-multi-leg-route.ts` (NEW) — full-route verification (conservation, provenance, evidence binding, privacy).
- `package.json` — `verify:multi-leg` script.
- `lib/demo/custody-route.test.ts` (NEW) — route order + `suggestNextCustodyStep` coverage.
- `lib/demo/custody-service.test.ts` — `buildCustodyPath` multi-leg coverage (ordering, origin-only, evidence binding).
- `daml/Test/TraceabilityTest.daml` — `testMultiLegRoute` scenario.

### Change Log

- 2026-06-13: Implemented multi-leg outbound custody transfer across the demo route. Added custody-route source of truth, `buildCustodyPath`, route-aware transfer panel, multi-leg verification script + Daml scenario, and unit coverage. Typecheck/lint/tests/all verify scripts and `dpm build`/`dpm test` green.
