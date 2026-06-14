# Story 4.4: Evidence Binding and Privacy Verification

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the demo owner,
I want an end-to-end script that proves attestation evidence binding and the verifier privacy boundary,
so that the selective-disclosure claim is verifiable and reproducible, not just visual.

**Requirements Covered:** FR15, FR16, FR17, NFR (privacy/integrity)

## Acceptance Criteria

1. Given a generated attestation references evidence, when the evidence binding is checked, then each referenced evidence hash maps to an evidence record bound to a custody step in the shared path, and no unbound or dangling evidence reference is presented as verified.
2. Given the verifier inspects an attestation, when privacy is verified, then the verifier-reachable data contains only the selectively shared fields, and a verification step confirms no private holdings/balances/counterparties/hidden custody steps are exposed.
3. Given the attestation generation and verification logic, when an automated verification script runs (`pnpm verify:attestation`), then it asserts: deterministic generation, evidence binding, verifier-only field exposure, and provenance continuity, and the script exits non-zero on any violation.
4. Given the verification script is part of the demo gate, when `pnpm verify` (or the demo verification aggregate) runs, then the attestation script is included, and a regression in attestation privacy/integrity fails the gate.
5. Given an attestation with a deliberately tampered or removed evidence/field, when the script runs, then the relevant assertion fails clearly, proving the checks are real (negative test).

## Tasks / Subtasks

- [ ] Create `scripts/verify-attestation.ts` (mirror `scripts/verify-multi-leg-route.ts` / `scripts/verify-party-visibility.ts` structure: `#!/usr/bin/env node`, import from `@/lib/...`, `main()`, `process.exit(1)` on failure, summary log on success). Drive it from `SEED_ASSETS` + `SEED_TRANSFERS` (and the demo custody service for any run-the-route setup), generating an attestation for an authorized destination-port received lot. (AC: 3)
- [ ] Assertion: deterministic generation — generate twice from identical inputs, assert equal `attestationId`; mutate one bound input (evidence hash / quantity / custody step), assert the id changes. (AC: 3)
- [ ] Assertion: evidence binding — for every `evidenceRef` in the attestation, confirm it maps to an evidence record bound to a custody step in the SHARED path (`evidenceHashes` on the corresponding `CustodyPathStep`); fail on any dangling/unbound reference. (AC: 1, 3)
- [ ] Assertion: verifier-only field exposure — build the shareable payload, assert its top-level keys ⊆ the allowed attestation projection and intersect with `VERIFIER_SHARED_FIELD_KEYS` semantics; assert NO holdings, balances, counterparties, or hidden custody steps appear. Cross-check with `snapshotPartyVisibility(VERIFIER_PARTY_VIEW_ID, ...)` that the verifier sees zero private holdings. (AC: 2, 3)
- [ ] Assertion: provenance continuity — run `verifyAttestation(payload)` (Story 4.3) and assert `provenanceContinuous === true` and `verified === true` for the happy path. (AC: 3)
- [ ] Negative tests inside the script (AC5): (a) remove/tamper an evidence reference → evidence-binding assertion fails; (b) inject a hidden/private field into the payload → verifier-exposure assertion fails; (c) break the custody path order → provenance-continuity assertion fails. Implement as in-script sub-checks that EXPECT failure (assert the checker returns false / throws), so the script proves the checks are real without leaving the script red on the happy path. (AC: 5)
- [ ] Add `"verify:attestation": "tsx scripts/verify-attestation.ts"` (match the runner used by existing verify scripts) to `package.json` scripts, and include it in the aggregate `verify` script alongside `verify:multi-leg-route` / `verify:party-visibility`. (AC: 3, 4)
- [ ] Ensure the script passes with the current seed; if the seed lacks an authorized destination-port received lot WITH evidence, either (a) run the demo route via the custody service to produce one, or (b) extend seed/test fixtures minimally — do NOT weaken privacy rules to make it pass. Document the chosen approach in Completion Notes. (AC: 1, 3)
- [ ] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm verify`; zero warnings, all green. (AC: all)

## Dev Notes

### Architecture & patterns (must follow)

- Demo integrity is proven by scripts, not vibes: existing verification scripts assert conservation, provenance, evidence binding, and privacy from the seed. The attestation script extends this gate. [Source: scripts/verify-multi-leg-route.ts, scripts/verify-party-visibility.ts, package.json]
- Selective disclosure / privacy boundary is the core NFR for Epic 4 — the verifier must be provably limited to shared fields. [Source: architecture.md#Authentication & Security, #In-App Verifier View]
- Evidence binding integrity: referenced evidence must be bound to a real custody step; dangling references must never read as verified. [Source: epic-4#Story 4.4 AC1, lib/demo/custody-service.ts evidenceHashes]

### Existing patterns to mirror

- Script skeleton + multi-assertion + summary log + `process.exit(1)`: `scripts/verify-multi-leg-route.ts` (conservation/provenance/evidence/privacy) and `scripts/verify-party-visibility.ts` (visibility matrix + verifier zero-holdings). Copy this shape. [Source: scripts/verify-multi-leg-route.ts, scripts/verify-party-visibility.ts]
- Visibility snapshot helper: `snapshotPartyVisibility` + `verifyVisibilityMatrix` from `lib/demo/visibility-matrix.ts`. [Source: lib/demo/visibility-matrix.ts]
- Verifier whitelist: `VERIFIER_SHARED_FIELD_KEYS` from `lib/demo/verifier-field-boundary.ts`. [Source: lib/demo/verifier-field-boundary.ts]
- Attestation API surface from Stories 4.1–4.3: `evaluateAttestationReadiness`, `generateAttestation`, `buildShareablePayload`, `verifyAttestation` in `lib/demo/attestation.ts`. [Source: lib/demo/attestation.ts]
- Seed data + party ids: `SEED_ASSETS`, `SEED_TRANSFERS`, `VERIFIER_PARTY_VIEW_ID`, `NON_INVOLVED_PARTY_VIEW_ID`. [Source: lib/data.ts, lib/demo/party-views.ts]

### Source tree components to touch

- `scripts/verify-attestation.ts` (NEW) — end-to-end attestation integrity + privacy gate.
- `package.json` — add `verify:attestation` and include it in the aggregate `verify` script.
- (No UI changes; this story hardens Stories 4.1–4.3.)

### Testing standards

- The script IS the test here (demo gate), complementing `lib/demo/attestation.test.ts`. Each assertion must produce a distinct, human-readable failure line and exit non-zero. Negative sub-checks prove the assertions are real. [Source: scripts/verify-multi-leg-route.ts]
- Keep all attestation logic pure (Stories 4.1–4.3) so the Node script can import and exercise it directly without a browser. [Source: lib/file-hash.ts caveat — prefer node:crypto in the script path]

### Project Structure Notes

- Confirm the exact runner used by existing verify scripts (`tsx` vs `ts-node` vs `node --import`) by reading the current `package.json` scripts and match it precisely for `verify:attestation`. [Source: package.json]
- Do NOT relax `lib/demo/visibility-matrix.ts` or `verifier-field-boundary.ts` to make the script pass; fix generation/projection instead. [Source: architecture.md#Authentication & Security]

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-selective-attestation-verifier-proof.md#Story 4.4]
- [Source: scripts/verify-multi-leg-route.ts]
- [Source: scripts/verify-party-visibility.ts]
- [Source: lib/demo/visibility-matrix.ts]
- [Source: lib/demo/verifier-field-boundary.ts]
- [Source: package.json]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (Cursor agent)

### Debug Log References

### Completion Notes List

- Added `scripts/verify-attestation.ts` (run via `pnpm verify:attestation`) asserting: deterministic generation (stable id, changes on input change), evidence binding (every reference bound to a custody step), verifier-only field exposure, and end-to-end provenance continuity.
- Negative tests confirm tamper, dangling evidence, and broken custody path are all rejected by `verifyAttestation`.
- Wired into the aggregate `pnpm verify` script in `package.json`; full aggregate passes (party-visibility, custody-transfers, combine, multi-leg, attestation).

### File List

- scripts/verify-attestation.ts (new)
- package.json (modified)
