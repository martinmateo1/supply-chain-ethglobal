# Story 4.1: Attestation Readiness Panel

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an authorized destination-port operator,
I want to see whether a received quantity is ready for attestation,
so that I know what custody, provenance, or evidence gaps must be resolved before generating proof.

**Requirements Covered:** FR14, FR16

## Acceptance Criteria

1. Given the active Party View is authorized for a received destination-port Lot Position, when the user opens asset detail, then an Attestation panel is available, and it summarizes Commodity, quantity, current node, certifications, custody path status, evidence status, issuer, recipient, and verification readiness.
2. Given the custody chain is incomplete, when attestation readiness is evaluated, then the panel explains which custody step, provenance reference, or evidence binding is missing, and the generate action is disabled or clearly marked unavailable.
3. Given evidence is missing for a custody step, when readiness is displayed, then the panel shows a warning state, and the warning does not falsely imply complete evidence verification.
4. Given the active Party View is not authorized for the received quantity, when the user attempts to view attestation readiness, then no private attestation details are shown, and the privacy message explains selective visibility.
5. Given earlier epics produced lot IDs, provenance references, and evidence records, when readiness is computed, then the panel uses those existing data shapes, and it does not require rewriting prior custody history to generate proof.
6. Given attestation readiness evaluates a fixture with origin lot, accepted transfers, split/combine references, and evidence bindings, when readiness status is produced, then the allowed input shape is constrained to selected quantity, issuer, recipient, visible custody path, provenance references, and evidence references, and hidden fields from unrelated parties remain unavailable to the readiness panel.

## Tasks / Subtasks

- [ ] Create `lib/demo/attestation.ts` as the READ-ONLY attestation projection layer for Epic 4. Define `AttestationReadinessInput` (the constrained input shape: `selectedQuantity`, `issuer`, `recipient`, `custodyPath`, `provenanceRefs`, `evidenceRefs`) and `AttestationReadiness` (`status: "ready" | "warning" | "blocked"`, `gaps: AttestationGap[]`, plus the resolved summary fields). Derive everything purely from `Asset` + `Transfer[]` via `buildCustodyPath` / `buildProvenanceTimeline` — NO new persistence, NO mutation of prior custody state. (AC: 5, 6)
- [ ] Add `evaluateAttestationReadiness(asset, snapshot, partyViewId)` to `lib/demo/attestation.ts`. Authorization: only the current custodian of a received Lot Position (the active Party View's `operationalNodeId === asset.accountId`) is authorized; private party views (verifier/non-involved) and other route parties are NOT. Blocked when: unauthorized, custody path does not reach the active node, or provenance discontinuity. Warning when: one or more custody steps lack evidence bindings. Ready when: custody path is complete and continuous. (AC: 1, 2, 3)
- [ ] Constrain the readiness input shape (AC6): readiness must only read selected quantity, issuer (current custodian), recipient (intended buyer/verifier), the *visible* custody path, provenance references, and evidence references. Pass only party-visible transfers into `buildCustodyPath`/`buildProvenanceTimeline` (mirror the `partyTransfers` scoping already used in `components/asset-detail-view.tsx`) so hidden fields from unrelated parties are structurally unavailable. Document the allowed shape in code comments. (AC: 6)
- [ ] Build `components/attestation-panel.tsx` and mount it in `components/asset-detail-view.tsx`, REPLACING the existing static "Attestation preview" `<section>` (lines ~434–469). The panel summarizes Commodity, quantity, current node, certifications, custody path status, evidence status, issuer, recipient, and verification readiness; renders a disabled/"unavailable" generate action when `status === "blocked"`, an enabled generate action when ready, and a non-deceptive warning banner when `status === "warning"`. Generate action is a stub here (wired in Story 4.2). (AC: 1, 2, 3)
- [ ] Privacy gating (AC4): when the active Party View is unauthorized for the lot (private view or non-custodian), the panel shows NO private attestation details and instead renders a selective-visibility explanation consistent with `components/privacy-callout.tsx` / the existing "Not visible to this party" copy. Note: asset detail already blocks the whole page for fully-invisible assets via `isAssetVisibleToSelectedParty`; the panel must additionally suppress attestation specifics for parties that can see the lot in history but are not its current custodian. (AC: 4)
- [ ] Reuse existing meta/format helpers (`COMMODITY_META`, `CERTIFICATION_META`, `STAGE_META`, `formatTons`, `tokenId`, `originFingerprint`) and the `lucide-react` `ShieldCheck` icon already imported in asset detail. Do NOT add new dependencies. Use `next/image` via the existing `CommodityThumbnail` if a thumbnail is shown. (AC: 1)
- [ ] Add `lib/demo/attestation.test.ts` (vitest): authorized-ready, warning (missing evidence), blocked (incomplete custody / unauthorized), and the AC6 input-shape constraint (assert the readiness object exposes only the allowed fields and that an unrelated party's hidden transfers never appear in the custody path). (AC: 1, 2, 3, 6)
- [ ] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`; zero warnings. (AC: all)

## Dev Notes

### Architecture & patterns (must follow)

- Attestation is a READ-ONLY projection over `assets` + `transfers` + provenance fields. Custody truth stays in Daml/Canton; the demo service is the active path. Do NOT introduce parallel persistence or rewrite prior custody history. [Source: architecture.md#Frontend Architecture, #Critical Decisions]
- Selective visibility is per Operational Node. The readiness panel must never surface another party's private custody/evidence data; verifier and non-involved views are private (`isPrivatePartyView`). [Source: architecture.md#Authentication & Security, lib/provenance.ts]
- Domain naming: `LotPosition`, `CustodyTransfer`, `ProvenanceLink`, `TraceabilityAttestation`, `EvidenceReference`. Keep glossary terms in domain-facing code. [Source: architecture.md#Naming Patterns]
- Generation reads Canton-visible provenance and source asset references, then emits a selective proof view WITHOUT granting broad contract visibility. This story is the readiness/availability gate before generation. [Source: architecture.md#Custody-Chain Attestation]

### Existing patterns to mirror

- `buildCustodyPath(asset, transfers)` and `buildProvenanceTimeline(asset, snapshot, visibleTransfers?)` in `lib/demo/custody-service.ts` are the data backbone — Story 3.4 explicitly left them stable so Epic 4 consumes them without changes. Use them; do not re-derive provenance. [Source: lib/demo/custody-service.ts, _bmad-output/implementation-artifacts/3-4-provenance-timeline-and-anti-double-spend-checks.md]
- `CustodyPathStep` already exposes `accountId`, `quantity`, `transferId`, `evidenceHashes`, `sourceProvenanceRef`, `occurredAt` — exactly the readiness inputs. [Source: lib/demo/custody-service.ts]
- Asset-detail visibility scoping: `transfersVisibleToParty(...)` + `partyTransfers` in `components/asset-detail-view.tsx` is the canonical way to scope to the active Party View. Reuse the same scoping for readiness. [Source: components/asset-detail-view.tsx]
- Privacy copy/pattern: `components/privacy-callout.tsx` and the "Not visible to this party" block in asset detail. [Source: components/asset-detail-view.tsx, components/privacy-callout.tsx]
- Verifier shared-field boundary already exists: `lib/demo/verifier-field-boundary.ts` (`VERIFIER_SHARED_FIELD_KEYS`). The readiness input shape is broader (custody path/evidence for the authorized custodian) but must still exclude unrelated holdings/balances/counterparties. [Source: lib/demo/verifier-field-boundary.ts]
- `LedgerErrorCode.ATTESTATION_NOT_AVAILABLE` already exists for the blocked case if an error path is needed. [Source: lib/ledger/errors.ts]

### Source tree components to touch

- `lib/demo/attestation.ts` (NEW) — `AttestationReadinessInput`, `AttestationReadiness`, `AttestationGap`, `evaluateAttestationReadiness`.
- `components/attestation-panel.tsx` (NEW) — readiness summary + gated generate stub.
- `components/asset-detail-view.tsx` — replace the static attestation preview with `<AttestationPanel />`.
- `lib/demo/attestation.test.ts` (NEW) — readiness coverage.

### Testing standards

- `vitest` (`pnpm test`) for `evaluateAttestationReadiness` purity and the AC6 input-shape constraint. Negative cases (unauthorized, incomplete chain) must assert `status === "blocked"`, not just absence of success. [Source: lib/demo/custody-service.test.ts]
- No new verify script in this story; Story 4.4 adds the end-to-end attestation-privacy script.

### Project Structure Notes

- New attestation domain logic lives in `lib/demo/attestation.ts` (mirrors existing `lib/demo/*` pattern), not `lib/domain/` (which does not exist in this repo). Components stay in `components/`. [Source: lib/demo/*, components/*]
- Keep `lib/demo/attestation.ts` stable and documented — Stories 4.2/4.3/4.4 build directly on it.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-selective-attestation-verifier-proof.md#Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Custody-Chain Attestation]
- [Source: lib/demo/custody-service.ts]
- [Source: components/asset-detail-view.tsx]
- [Source: lib/demo/verifier-field-boundary.ts]
- [Source: _bmad-output/implementation-artifacts/3-4-provenance-timeline-and-anti-double-spend-checks.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (Cursor agent)

### Debug Log References

### Completion Notes List

- Added `lib/demo/attestation.ts` with `evaluateAttestationReadiness` returning `blocked | warning | ready` plus structured gaps (custody, provenance, evidence). Pure function over a constrained readiness input — no holdings/balances/counterparties leak.
- Built `components/attestation-panel.tsx` showing the readiness summary (commodity, quantity, node, certifications, custody/evidence status, issuer, recipient) and a generate action gated by readiness; unauthorized Party Views see only a privacy message.
- Replaced the static attestation preview in `components/asset-detail-view.tsx` with `<AttestationPanel />`.
- Unit coverage in `lib/demo/attestation.test.ts` asserts blocked/warning/ready transitions and the constrained input shape. `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass.

### File List

- lib/demo/attestation.ts (new)
- lib/demo/canonical-hash.ts (new)
- components/attestation-panel.tsx (new)
- components/asset-detail-view.tsx (modified)
- lib/demo/attestation.test.ts (new)
- lib/demo/canonical-hash.test.ts (new)
