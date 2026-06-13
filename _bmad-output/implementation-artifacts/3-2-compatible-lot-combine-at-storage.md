# Story 3.2: Compatible Lot Combine at Storage

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a storage operator,
I want to combine compatible received Lot Positions,
so that stored inventory can be aggregated without losing provenance or certification meaning.

**Requirements Covered:** FR9

## Acceptance Criteria

1. Given the active Party View is a storage Operational Node, when compatible Lot Positions are visible, then the UI offers a combine action, and compatibility is based on same Commodity plus supported certification compatibility rules.
2. Given selected Lot Positions are compatible, when the storage operator confirms combine, then a combined Lot Position is created or updated, and the combined quantity equals the sum of the source quantities.
3. Given the deterministic combine fixture includes compatible and incompatible lots, when combine tests run, then only compatible Commodity and certification combinations can combine, and incompatible lots remain separate with their original quantities and provenance intact.
4. Given source Lot Positions are combined, when the combined holding is inspected, then the UI shows source references, before quantities, combined quantity, and certification compatibility, and Provenance Links to all source positions remain available.
5. Given selected Lot Positions are incompatible, when the storage operator attempts to combine them, then the action is blocked, and the UI explains which Commodity or certification rule prevents the combine.
6. Given a combined Lot Position is later transferred or attested, when downstream workflows read provenance, then all source Lot Positions remain traceable, and evidence and certifications are not silently dropped.

## Tasks / Subtasks

- [x] Define a pure compatibility predicate in `lib/demo/custody-service.ts` (e.g. `lotsAreCompatible(a, b)`): same `commodityType`, identical certification set (compare by normalized cert keys/standards, order-independent), and matching grade/rating if present. Return a structured reason on incompatibility so the UI can explain it. (AC: 1, 3, 5)
- [x] Implement `combineLots(state, { partyId, lotIds })` in `lib/demo/custody-service.ts`: assert all lots are owned/visible to the storage party, assert pairwise compatibility, sum quantities, create a new combined `Asset` (or update an existing combined position) carrying union of provenance links + `sourceLotIds`, preserved certifications, and merged evidence references. Archive/remove source lots only after the combined position is created. Conservation: combined quantity === sum of source available quantities exactly. (AC: 2, 4, 6)
- [x] Extend `Asset` in `lib/types.ts` with optional additive fields if needed: `sourceLotIds?: string[]` and (if not already retained) provenance link aggregation. Keep changes additive and backward-compatible with seed data. (AC: 4, 6)
- [x] Add gateway support: `gatewayCombineLots` in `lib/ledger/gateway.ts` routing to the demo service (and a Canton stub mirroring the Daml choice). (AC: 2)
- [x] Add API route `app/api/ledger/combine-lots/route.ts` following the `initiate-transfer` route pattern and `lib/api/ledger-route.ts` response helpers. (AC: 2)
- [x] Add client hook usage in `hooks/use-custody-gateway.ts` (e.g. `combineLots`) that posts to the new route and applies the returned custody snapshot to `lib/store.ts`. (AC: 2)
- [x] Add a combine UI affordance in the storage Party View: a new panel/component (e.g. `components/combine-panel.tsx`) surfaced from `components/traceability-view.tsx`. Show selectable compatible lots, source references + before quantities, projected combined quantity, certification compatibility, and a blocked state with an explanation for incompatible selections. Only render for storage operational-node party views. (AC: 1, 4, 5)
- [x] Surface combined-lot provenance in `components/asset-detail-view.tsx`: list source references and confirm certifications/evidence carried forward. (AC: 4, 6)
- [x] Daml parity: add a `CombineLots` choice to `daml/Commodity/LotPosition.daml` (consumes compatible `LotPosition` contracts of the same owner/commodity/cert set, creates a combined `LotPosition` referencing sources). Build with `dpm build`. (AC: 2, 6)
- [x] Add deterministic vitest tests in `lib/demo/custody-service.test.ts` (or `combine.test.ts`): compatible combine sums quantities and preserves provenance/certs; incompatible (different commodity, different cert set) is rejected with reason; conservation holds exactly. (AC: 2, 3, 5)
- [x] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`; zero warnings. Add a `verify:combine` script entry if a standalone smoke is warranted. (AC: all)

## Dev Notes

### Architecture & patterns (must follow)

- Custody truth lives in Daml/Canton; demo service mirrors rules and is the active path under `LEDGER_BACKEND=demo`. New combine logic lives in `lib/demo/custody-service.ts`, NOT the store. [Source: architecture.md#Frontend Architecture, #Enforcement Guidelines]
- Quantity conservation is a hard invariant: combined quantity must equal the exact sum of source available quantities (integer tons). [Source: architecture.md#Cross-Cutting Concerns]
- Domain naming: `LotPosition`, `CustodyTransfer`, `ProvenanceLink`, `SourceAssetReference`. [Source: architecture.md#Naming Patterns]
- Selective visibility: combine only operates on lots visible/owned by the active storage Party View; combined provenance follows `isAssetVisibleToParty` rules in `lib/provenance.ts`. [Source: architecture.md#Authentication & Security]

### Existing patterns to mirror

- Gateway boundary: `lib/ledger/gateway.ts` switches demo vs canton; add `gatewayCombineLots` next to existing custody commands. [Source: lib/ledger/gateway.ts]
- API route shape: copy `app/api/ledger/initiate-transfer/route.ts` and `lib/api/ledger-route.ts` for success/error envelopes. [Source: app/api/ledger/initiate-transfer/route.ts]
- Client hook: `hooks/use-custody-gateway.ts` already wraps `postCustody` + snapshot application; add a `combineLots` method following `initiateTransfer`. [Source: hooks/use-custody-gateway.ts]
- Certification model: certifications are on `Asset` per `lib/types.ts`; compatibility compares the normalized certification set, not array order. [Source: lib/types.ts]
- Party/operational-node gating: `lib/demo/operational-nodes.ts` + `lib/demo/party-views.ts` identify storage nodes; reuse `lib/demo/party-view-auth.ts` to assert authorization. [Source: lib/demo/party-view-auth.ts]

### Source tree components to touch

- `lib/demo/custody-service.ts` — `lotsAreCompatible`, `combineLots`.
- `lib/types.ts` — additive `sourceLotIds?` etc.
- `lib/ledger/gateway.ts` — `gatewayCombineLots`.
- `app/api/ledger/combine-lots/route.ts` — NEW route.
- `hooks/use-custody-gateway.ts` — `combineLots` client method.
- `components/combine-panel.tsx` — NEW storage combine UI.
- `components/traceability-view.tsx` — mount combine panel for storage views.
- `components/asset-detail-view.tsx` — show combined-lot source provenance.
- `daml/Commodity/LotPosition.daml` — `CombineLots` choice.
- `lib/demo/custody-service.test.ts` — combine tests.

### Testing standards

- `vitest` via `pnpm test`; co-locate `*.test.ts`. Keep `lotsAreCompatible` / `combineLots` pure for unit testing. [Source: lib/ledger/mappers.test.ts]
- Daml `CombineLots` covered in `daml/Test/TraceabilityTest.daml` with `submitMustFail` for incompatible combines. [Source: .cursor/rules/daml-dpm.mdc]

### Project Structure Notes

- Stay within `app/`, `components/`, `hooks/`, `lib/`, `daml/Commodity/`. Combine is a first-class new gateway command (unlike split which reuses transfer). [Source: architecture.md#Project Organization]

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-split-combine-multi-leg-storage-operations.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: lib/demo/custody-service.ts]
- [Source: _bmad-output/implementation-artifacts/3-1-partial-transfer-split-with-conservation-feedback.md] (conservation helper + provenance retention established here)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (Cursor agent), demo-first implementation with Daml parity.

### Debug Log References

- `pnpm typecheck` — clean
- `pnpm lint` — zero warnings
- `pnpm test --run` — 52 passed (3 files), incl. new `lotsAreCompatible` + `combineLots` suites
- `pnpm verify:combine` — compatible combine conserves quantity + provenance; incompatible and unauthorized combines blocked
- `dpm build` — DAR produced (only expected daml-script dependency warning)
- `dpm test` — 7 scripts pass, incl. `testCombineCompatible`, `testCombineIncompatibleCommodity`, `testCombineIncompatibleCerts`

### Completion Notes List

- Combine is a first-class gateway command (unlike split, which reuses the transfer flow). `gatewayCombineLots` routes to the demo service under `LEDGER_BACKEND=demo`; the Canton branch throws a clear "not yet wired" `LedgerError` while the Daml `CombineLots` choice provides ledger parity + tests.
- Conservation is enforced: combined quantity is the exact sum of source quantities (integer tons). Source lots are removed only after the combined `Asset` is constructed.
- Provenance: combined `sourceLotIds` is the de-duplicated union of each source's prior `sourceLotIds` plus its own id; origin evidence is merged by hash (no duplicates); `originIdentifier` is carried from the first source that has one. Certifications/rating/commodity are guaranteed identical by the compatibility gate.
- Anti-double-spend: lots reserved by a pending transfer cannot be combined (rejected in service + flagged in the UI).
- Authorization: `assertCombineOperator` requires the active Party View's operational node to equal the holding node; the combine affordance only renders for `storage` party views.
- Certification-set comparison is order-independent (via `certificationKey` in the demo, `sameCertSet` in Daml).

### File List

- `lib/types.ts` — `sourceLotIds?` already added in 3.1; reused here.
- `lib/demo/party-view-auth.ts` — added `assertCombineOperator`.
- `lib/demo/custody-service.ts` — added `CombineLotsRequest`, `CompatibilityResult`, `lotsAreCompatible`, `mergeEvidence`, `combineLots`.
- `lib/ledger/gateway.ts` — added `gatewayCombineLots` (demo route + Canton stub).
- `app/api/ledger/combine-lots/route.ts` — NEW route.
- `hooks/use-custody-gateway.ts` — added `combineLots` client method.
- `components/combine-panel.tsx` — NEW storage combine UI (selectable compatible lots, combine summary, blocked-state explanations).
- `components/traceability-view.tsx` — mounts combine panel + "Combine lots" action for storage party views.
- `components/asset-detail-view.tsx` — "Source lot positions" section for derived (split/combined) lots.
- `daml/Commodity/LotPosition.daml` — `CombineLots` choice + `sameCertSet` helper.
- `daml/Test/TraceabilityTest.daml` — `testCombineCompatible`, `testCombineIncompatibleCommodity`, `testCombineIncompatibleCerts`.
- `lib/demo/custody-service.test.ts` — `lotsAreCompatible` + `combineLots` test suites.
- `scripts/verify-combine.ts` + `package.json` — `verify:combine` smoke script.

### Change Log

- 2026-06-13: Implemented compatible lot combine end-to-end (demo service, gateway, API route, client hook, storage UI, asset-detail provenance) with Daml `CombineLots` parity and tests. Status → review.
