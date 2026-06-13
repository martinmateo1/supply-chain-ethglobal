# Story 3.1: Partial Transfer Split with Conservation Feedback

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a custody operator,
I want partial transfers to explicitly split Lot Positions,
so that quantity conservation and provenance remain understandable when only part of a holding moves.

**Requirements Covered:** FR8, FR10

## Acceptance Criteria

1. Given a source Lot Position has available quantity, when the user initiates a transfer for less than the full quantity, then the operation creates a transferred child position and a remaining source position (or equivalent ledger state), and the child and remaining quantities sum to the original quantity.
2. Given the deterministic split fixture starts with a known source quantity, when split tests run, then transferred quantity plus retained quantity equals the source quantity exactly, and rounding, unit conversion, or display formatting cannot hide conservation errors.
3. Given a partial transfer is reviewed, when the summary is displayed, then the UI labels the operation as a split and shows before quantity, transfer quantity, remaining quantity, and source reference.
4. Given the split transfer is accepted, when the destination party views the received holding, then the received Lot Position preserves Commodity, certification metadata, and Provenance Links, and unrelated parties cannot see split details unless entitled.
5. Given the user attempts a split with invalid quantity, when the requested amount is zero, negative, or greater than available quantity, then the operation is blocked, and the UI explains the quantity conservation rule.
6. Given split data is later used for attestation, when provenance is read, then the source and derived references remain available, and the attestation workflow can distinguish transferred quantity from remaining balance.

## Tasks / Subtasks

- [x] Add a pure conservation helper to `lib/demo/custody-service.ts` (e.g. `splitConservation(sourceQuantity, transferQuantity)` returning `{ before, transferred, remaining }`) and an `isPartialTransfer` predicate. Quantities are integer tons in this demo; assert `transferred + remaining === before` exactly (no float drift). (AC: 1, 2)
- [x] Ensure `applyAcceptedTransfer` produces a clean split: source position reduced (or archived when fully consumed via existing `quantity > 0` filter), child created at destination, and that the child carries `sourceProvenanceRef` and a derived source reference so provenance survives. Extend the `Asset` and/or `Transfer` shape only if needed to retain a `sourceLotId` / derived reference (prefer reusing `sourceProvenanceRef` + a new optional `sourceLotIds?: string[]` on `Asset`). (AC: 1, 4, 6)
- [x] Update `components/transfer-panel.tsx` review summary so that when `quantity < availableQuantityForAsset(asset)` it labels the operation a "Split" and shows Before (current quantity), Transfer quantity, Remaining (before − transfer), and the source reference (`tokenId` + `originFingerprint`). When `quantity === available` keep the existing full-transfer copy. (AC: 3)
- [x] Confirm invalid-quantity handling: zero, negative, non-finite, and over-available are blocked with a message that states the quantity conservation rule. Reuse `INSUFFICIENT_QUANTITY` in `initiateTransfer`; refine the user-facing copy to explain "transferred + remaining must equal the source quantity". (AC: 5)
- [x] Add a deterministic unit test `lib/demo/custody-service.test.ts` (vitest) covering: partial split conservation (e.g. 12,500 → 4,000 transfer leaves 8,500), full transfer archives source, invalid quantities rejected, and accepted child preserves commodity/certifications/provenance. (AC: 1, 2, 4, 5, 6)
- [x] Verify Daml parity: `daml/Commodity/LotPosition.daml` `InitiateTransfer` already creates a remainder `LotPosition` when `transferAmount < quantity.amount`. Confirmed no model change required — `testCustodyHappyPath` in `daml/Test/TraceabilityTest.daml` already asserts the 40/60 remainder split and provenance preservation. (AC: 1, 6)
- [x] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm verify:custody-transfers`; all pass with zero warnings. (AC: all)

## Dev Notes

### Architecture & patterns (must follow)

- Source of truth: custody truth lives in Daml/Canton; the demo backend (`lib/demo/custody-service.ts`) mirrors the same rules and is the active path in `LEDGER_BACKEND=demo`. Do NOT move custody authority into the Zustand store (`lib/store.ts` is UI/demo state only). [Source: architecture.md#Frontend Architecture, #Enforcement Guidelines]
- Quantity conservation is a hard invariant for split/combine/transfer; include conservation checks in tests/scripts. [Source: architecture.md#Cross-Cutting Concerns, #Enforcement Guidelines]
- Use PRD Glossary terms in domain code: `LotPosition`, `CustodyTransfer`, `ProvenanceLink`, `SourceAssetReference`. Avoid `Batch`/`Account` in new domain symbols (UI may keep existing `Asset`/`Account` types). [Source: architecture.md#Naming Patterns]
- Selective visibility: split details must follow the same visibility as the underlying transfer — `lib/provenance.ts` `isAssetVisibleToParty` / `isTransferVisibleToParty` already gate this; do not widen observers. [Source: architecture.md#Authentication & Security]

### How split already works today (read before editing)

- `applyAcceptedTransfer` in `lib/demo/custody-service.ts` already implements the split mechanic on accept: it subtracts `transfer.quantity` from the source asset, filters out zero-quantity sources, and either merges into a matching destination asset or creates a new child asset carrying `originIdentifier` and `originEvidence`. This story makes the split explicit, conservation-checked, and visible — it does not rewrite the accept flow.
- Reserve-on-initiate: `initiateTransfer` reserves the pending quantity (`reservedQuantityForAsset`) so available quantity already accounts for in-flight splits. `availableQuantityForAsset = quantity − reserved`.
- `sourceProvenanceRef` is set on the `Transfer` at initiate time via `originFingerprint(sourceAsset)` (`lib/provenance.ts`). Keep this; it is the provenance link the attestation workflow (Epic 4) reads.

### Source tree components to touch

- `lib/demo/custody-service.ts` — add conservation helper + predicate; ensure child provenance retention.
- `components/transfer-panel.tsx` — split-aware review summary (before/transfer/remaining/source ref).
- `lib/types.ts` — only if a derived `sourceLotIds?: string[]` field is needed on `Asset` (keep optional, additive).
- `lib/provenance.ts` — reuse `originFingerprint`, `tokenId`; add a derived-reference helper only if needed.
- `daml/Commodity/LotPosition.daml` — parity check only (likely no change).
- `lib/demo/custody-service.test.ts` — NEW vitest unit test.

### Testing standards

- Test runner is `vitest` (`pnpm test`). Co-locate unit tests next to source as `*.test.ts` (see `lib/ledger/mappers.test.ts`).
- Keep custody-service helpers pure so they are unit-testable without React.
- The standalone script `scripts/verify-custody-transfers.ts` (run via `pnpm verify:custody-transfers`) is the integration smoke for custody math — extend it only if needed; prefer the new vitest test for split conservation.
- Daml changes (if any) must compile via `dpm build` and be covered by `daml/Test/TraceabilityTest.daml` with `submitMustFail` for invalid splits. [Source: .cursor/rules/daml-dpm.mdc]

### Project Structure Notes

- Frontend lives under `app/`, `components/`, `hooks/`, `lib/`; demo custody logic under `lib/demo/`; Daml under `daml/Commodity/`. This story stays within those boundaries. [Source: architecture.md#Project Organization]
- No new API route is required: split happens inside the existing `initiate-transfer` → `accept-transfer` flow. Do not add a separate `split-lot` route for the demo backend; the Daml `split-lot` route in the architecture map is the Canton-path equivalent of `InitiateTransfer` with a remainder.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-split-combine-multi-leg-storage-operations.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: lib/demo/custody-service.ts#applyAcceptedTransfer]
- [Source: components/transfer-panel.tsx]
- [Source: _bmad-output/implementation-artifacts/2-1-custody-transfer-request-with-evidence.md] (previous story patterns: reserve-on-initiate, evidence normalization, gateway boundary)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (Cursor)

### Debug Log References

- `pnpm typecheck` — clean
- `pnpm test` — 39 passing (3 files)
- `pnpm lint` — zero warnings
- `pnpm verify:custody-transfers` — double-spend blocked, verification passed

### Completion Notes List

- Made the partial-transfer split explicit and conservation-checked without rewriting the accept flow.
- `splitConservation` enforces `transferred + remaining === before` exactly (integer tons, no rounding path); `applyAcceptedTransfer` now routes through it for both partial and full transfers.
- Child lot positions now carry `sourceLotIds` (derived provenance back to the source lot) in addition to existing `originIdentifier`/`originEvidence` and the transfer's `sourceProvenanceRef`, so attestation can distinguish transferred quantity from the remaining balance.
- Transfer panel surfaces a "Split" badge with Before / Transfer / Remaining rows and a conservation sentence when the amount is less than available; full transfers keep the original summary.
- Daml parity confirmed: `InitiateTransfer` already emits a remainder `LotPosition`; covered by `testCustodyHappyPath`.

### File List

- `lib/types.ts` (modified — additive `sourceLotIds?` on `Asset`)
- `lib/demo/custody-service.ts` (modified — `splitConservation`, `isPartialTransfer`, conservation-checked split + derived provenance, conservation messaging)
- `components/transfer-panel.tsx` (modified — split-aware summary)
- `lib/demo/custody-service.test.ts` (new — split/conservation/provenance tests)

### Change Log

- 2026-06-13: Implemented explicit partial-transfer split with quantity-conservation feedback, derived provenance, and split-aware UI. Status → review.
