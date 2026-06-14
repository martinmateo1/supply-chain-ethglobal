# Story 4.3: In-App Verifier View

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a verifier Party View,
I want to open a generated attestation and confirm provenance and certifications,
so that I can validate a claim using only the selectively shared facts, without access to the full ledger.

**Requirements Covered:** FR15, FR17

## Acceptance Criteria

1. Given a generated attestation (Story 4.2), when the verifier Party View opens it, then the verifier sees Commodity, quantity, issuer, recipient, certifications, ordered custody path, provenance references, and evidence references, and the verifier sees nothing beyond the selectively shared fields.
2. Given the verifier inspects the attestation, when they confirm the claim, then a verification result is shown (e.g., provenance continuous, certifications present, evidence referenced), and the result is derived only from the shared attestation content.
3. Given the verifier attempts to navigate from the attestation to broader ledger data, when access is evaluated, then no private custody, holdings, balances, or counterparties are reachable, and the privacy boundary is enforced for the verifier view.
4. Given an attestation with a broken or incomplete shared custody path, when the verifier inspects it, then the verification result clearly flags the gap, and it does not present the attestation as fully verified.
5. Given the verifier view renders the attestation, when displayed, then it reuses existing UI patterns/components, and it does not introduce a separate or conflicting design language.

## Tasks / Subtasks

- [ ] Add a verifier-facing route/surface to open an attestation. Preferred: `app/verify/page.tsx` (paste/load a shareable proof payload) consistent with existing App Router pages; the verifier Party View is `VERIFIER_PARTY_VIEW_ID`. Reuse `AppNavbar` + `PartyViewSelector` shell. (AC: 1, 5)
- [ ] Add `verifyAttestation(payload): VerificationResult` to `lib/demo/attestation.ts`. `VerificationResult` = `{ provenanceContinuous: boolean; certificationsPresent: boolean; evidenceReferenced: boolean; gaps: string[]; verified: boolean }`. Compute ONLY from the shared payload fields (custody path order/continuity, certifications array, evidence refs) — never from `SEED_ASSETS`/`SEED_TRANSFERS` or store state. (AC: 2, 4)
- [ ] Parse + validate the shared payload defensively (it may be pasted): reject malformed payloads with a clear message; do not throw raw. Re-derive the attestation id from the payload via the Story 4.2 canonicalization and surface a tamper/mismatch flag if the embedded id does not match. (AC: 2, 4)
- [ ] Build `components/attestation-verifier.tsx` to render the attestation read-only (reusing `components/attestation-card.tsx` from Story 4.2) plus a `VerificationResult` panel with per-check status chips and a non-deceptive overall verdict ("Verified" only when all checks pass; otherwise "Incomplete — see gaps"). (AC: 1, 2, 4, 5)
- [ ] Enforce verifier privacy boundary (AC3): in the verifier view, do NOT link to `/assets/[id]` private custody detail, holdings, or balances. The verifier sees only payload-derived content. Confirm `isPrivatePartyView(VERIFIER_PARTY_VIEW_ID)` remains true and that no holdings/transfers leak (the existing visibility matrix + `verify-party-visibility` already assert the verifier sees zero holdings). (AC: 3)
- [ ] Reuse meta/format helpers (`COMMODITY_META`, `CERTIFICATION_META`, `STAGE_META`, `formatTons`, `tokenId`) and existing chip/badge styles so the verifier view matches the app's design language. No new design system, no new deps. (AC: 5)
- [ ] (Optional UX) Add a "Open in verifier" affordance from the generated attestation in `components/attestation-panel.tsx` that switches to `VERIFIER_PARTY_VIEW_ID` and loads the payload, demonstrating the cross-party handoff. (AC: 1)
- [ ] Extend `lib/demo/attestation.test.ts`: (a) `verifyAttestation` returns all-pass for a complete payload; (b) flags `provenanceContinuous=false` for a broken custody path (AC4); (c) flags missing certifications / missing evidence; (d) tamper detection — mutating a field without recomputing id is flagged; (e) verification uses only payload (no import of `lib/data`). (AC: 2, 4)
- [ ] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`; zero warnings. (AC: all)

## Dev Notes

### Architecture & patterns (must follow)

- "In-App Verifier View ... renders a generated attestation and validates provenance facts against the selectively shared view. The verifier confirms claims without direct access to private custody history, demonstrating Canton selective disclosure." [Source: architecture.md#In-App Verifier View]
- The verifier is a PRIVATE party view: it must never reach private custody, holdings, balances, or counterparties. Selective disclosure is the whole point of the demo's "wow" moment. [Source: architecture.md#Authentication & Security, lib/provenance.ts, lib/demo/party-views.ts]
- Verification is computed from the shared attestation content ONLY — this proves selective disclosure rather than re-querying the ledger. [Source: epic-4#Story 4.3 AC2]

### Existing patterns to mirror

- App Router page shell: `app/page.tsx` / `app/assets/[id]/page.tsx` compose `AppNavbar` + content; follow the same structure for `app/verify/page.tsx`. [Source: app/page.tsx, app/assets/[id]/page.tsx]
- Party view plumbing: `VERIFIER_PARTY_VIEW_ID`, `DEMO_PARTY_VIEWS`, `PartyViewSelector`, and `useStore` selected party view. [Source: lib/demo/party-views.ts, components/party-view-selector.tsx, lib/store.ts]
- Privacy precedents: `lib/demo/verifier-field-boundary.ts` (shared-field whitelist), `components/privacy-callout.tsx`, and the verifier zero-holdings invariant enforced in `scripts/verify-party-visibility.ts`. [Source: lib/demo/verifier-field-boundary.ts, scripts/verify-party-visibility.ts]
- Attestation rendering reuse: `components/attestation-card.tsx` from Story 4.2. Determinism/canonicalization from Story 4.2 for tamper detection. [Source: lib/demo/attestation.ts (Story 4.2)]
- Provenance-continuity logic precedent (ordering + gap detection) exists in `buildProvenanceTimeline` / Story 3.4; mirror its definition of "continuous" but apply it to the SHARED custody path only. [Source: lib/demo/custody-service.ts, _bmad-output/implementation-artifacts/3-4-provenance-timeline-and-anti-double-spend-checks.md]

### Source tree components to touch

- `app/verify/page.tsx` (NEW) — verifier surface.
- `components/attestation-verifier.tsx` (NEW) — read-only attestation + verification result.
- `lib/demo/attestation.ts` — add `verifyAttestation`, `VerificationResult`.
- `components/attestation-panel.tsx` — optional "Open in verifier" affordance.
- `lib/demo/attestation.test.ts` — extend.

### Testing standards

- `vitest`: `verifyAttestation` MUST NOT import `@/lib/data` or the store — enforce payload-only derivation (a test that the module graph stays clean, or simply construct payloads inline). Negative/gap cases must produce `verified === false`. [Source: lib/demo/custody-service.test.ts]

### Project Structure Notes

- Keep verification pure in `lib/demo/attestation.ts` so Story 4.4's script can assert the verifier path from Node. UI is thin. [Source: lib/demo/*]
- Do not add a separate verifier theme; reuse Tailwind tokens/components already in the app. [Source: epic-4#Story 4.3 AC5]

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-selective-attestation-verifier-proof.md#Story 4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#In-App Verifier View]
- [Source: lib/demo/party-views.ts]
- [Source: lib/demo/verifier-field-boundary.ts]
- [Source: scripts/verify-party-visibility.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (Cursor agent)

### Debug Log References

### Completion Notes List

- Added `verifyAttestation` to `lib/demo/attestation.ts` that validates an attestation using only the supplied payload — recomputes the canonical hash, checks evidence binding, and confirms provenance continuity. No store/ledger access.
- Built `components/attestation-verifier.tsx`: paste-a-payload UI that parses, verifies, and renders pass/fail with the selectively shared fields only, enforcing the verifier field boundary.
- Added the `/verify` route (`app/verify/page.tsx`) hosting the verifier; route is present in the production build.
- Tamper/dangling-evidence/broken-path negatives covered in tests.

### File List

- lib/demo/attestation.ts (modified)
- components/attestation-verifier.tsx (new)
- app/verify/page.tsx (new)
- lib/demo/attestation.test.ts (modified)
