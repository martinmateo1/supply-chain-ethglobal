# Story 4.2: Generate Custody-Chain Attestation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an authorized destination-port operator,
I want to generate a custody-chain attestation for a received quantity,
so that I can produce a selective, shareable proof of provenance and custody without exposing the full ledger.

**Requirements Covered:** FR14, FR15, FR16

## Acceptance Criteria

1. Given attestation readiness is satisfied (Story 4.1), when the operator generates an attestation, then a `TraceabilityAttestation` projection is produced for the selected quantity, and it includes Commodity, quantity, issuer, recipient, certifications, ordered custody path, provenance references, and evidence references.
2. Given an attestation is generated, when it is rendered, then it shows only selectively shared fields, and it never includes unrelated holdings, balances, counterparties, or hidden custody steps.
3. Given the same lot, custody path, provenance references, and evidence references, when an attestation is generated more than once, then the attestation identifier/content is deterministic for identical inputs, and it changes when any bound input changes.
4. Given attestation readiness is NOT satisfied, when generation is attempted, then generation fails with a clear reason, and no partial or misleading attestation is produced (`ATTESTATION_NOT_AVAILABLE`).
5. Given an attestation is generated, when the operator views it, then they can copy/share the proof payload, and the shared payload contains only the selectively shared fields.

## Tasks / Subtasks

- [ ] Extend `lib/demo/attestation.ts` with `TraceabilityAttestation` projection type and `generateAttestation(asset, snapshot, partyViewId): TraceabilityAttestation`. Fields: `attestationId` (deterministic), `commodity`, `quantity`, `unit`, `issuer`, `recipient`, `certifications`, `custodyPath` (ordered, projected), `provenanceRefs`, `evidenceRefs`, `generatedAt`. Build ONLY from the readiness result; do not read beyond `AttestationReadinessInput`. (AC: 1, 2)
- [ ] Guard generation with readiness: call `evaluateAttestationReadiness` first; if `status === "blocked"`, throw `new LedgerError(LedgerErrorCode.ATTESTATION_NOT_AVAILABLE, ...)` with the specific gap reason. Never emit a partial attestation. (AC: 4)
- [ ] Determinism: compute `attestationId` as a stable SHA-256 over a canonicalized projection (sorted keys, ordered custody path, normalized refs). Add `lib/demo/canonical-hash.ts` OR reuse a deterministic hash helper; the digest must be reproducible in Node (use `node:crypto` createHash for the script/server path, and keep the canonicalization pure so it matches). Identical inputs → identical id; any changed bound input → different id. (AC: 3)
- [ ] Field projection / privacy (AC2): explicitly whitelist output fields. Custody path steps expose only `{ node, quantity, occurredAt, evidenceHashes, provenanceRef }` — no counterparties outside the path, no balances, no unrelated lot ids. Reuse `VERIFIER_SHARED_FIELD_KEYS` from `lib/demo/verifier-field-boundary.ts` to assert no disallowed top-level field leaks into the shareable payload. (AC: 2, 5)
- [ ] Wire the generate action in `components/attestation-panel.tsx` (replacing the Story 4.1 stub): on click call `generateAttestation`, store the result in local component state (and optionally Zustand if cross-view recall is needed for Story 4.3), and render the generated `TraceabilityAttestation`. Disabled when readiness blocked. (AC: 1, 4)
- [ ] Add a shareable payload + copy action: `buildShareablePayload(attestation)` returns the selectively-shared JSON; a "Copy proof" button uses `navigator.clipboard.writeText`. The payload must equal the whitelisted projection (no hidden fields). (AC: 5)
- [ ] Add `components/attestation-card.tsx` (or render inline) to display the generated attestation: header (commodity thumbnail, token id), issuer→recipient, certifications, ordered custody path, provenance + evidence references, and the deterministic attestation id. Reuse existing meta/format helpers and `next/image` thumbnail. (AC: 1)
- [ ] Extend `lib/demo/attestation.test.ts`: (a) generated fields match AC1; (b) determinism — same inputs same id, changed evidence/quantity/path → different id; (c) blocked readiness → throws `ATTESTATION_NOT_AVAILABLE`; (d) shareable payload contains only whitelisted keys (AC2/AC5). (AC: 1, 2, 3, 4, 5)
- [ ] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`; zero warnings. (AC: all)

## Dev Notes

### Architecture & patterns (must follow)

- "Custody-Chain Attestation generation reads Canton-visible provenance and source asset references, then emits a selective proof view without granting broad contract visibility. ... Selective field exposure ... only the certification facts and source references the participant is entitled to share." [Source: architecture.md#Custody-Chain Attestation]
- Attestation is a projection — no broad ledger visibility is granted by generating it. Output is a constrained, shareable view. [Source: architecture.md#Critical Decisions, #Custody-Chain Attestation]
- `TraceabilityAttestation` is an existing domain/Daml concept; the demo path produces a projection of it (not a new ledger contract in this story). [Source: daml/Commodity/TraceabilityAttestation.daml, architecture.md#Naming Patterns]
- Determinism requirement is a domain invariant for proof integrity: identical bound inputs must yield identical proof; any change must change the proof. [Source: epic-4#Story 4.2 AC3]

### Existing patterns to mirror

- `evaluateAttestationReadiness` + `AttestationReadinessInput` from Story 4.1 are the SOLE input to generation. Do not bypass them. [Source: lib/demo/attestation.ts (Story 4.1)]
- Hashing precedent: `hashFile` in `lib/file-hash.ts` uses `crypto.subtle.digest("SHA-256", ...)` and `0x`-prefixed hex. For deterministic JSON canonicalization in both browser and Node, prefer `node:crypto` `createHash` on the server/script side and keep canonicalization pure. [Source: lib/file-hash.ts, scripts/verify-multi-leg-route.ts]
- Error pattern: `throw new LedgerError(LedgerErrorCode.ATTESTATION_NOT_AVAILABLE, message)`; surface the message in the panel like other custody errors. [Source: lib/ledger/errors.ts, components/asset-detail-view.tsx error handling]
- Verifier field boundary whitelist for output safety: `VERIFIER_SHARED_FIELD_KEYS`. [Source: lib/demo/verifier-field-boundary.ts]
- Evidence references display precedent: `components/evidence-reference-list.tsx` and `evidenceHashes` on `CustodyPathStep`. [Source: components/evidence-reference-list.tsx, lib/demo/custody-service.ts]

### Source tree components to touch

- `lib/demo/attestation.ts` — add `TraceabilityAttestation`, `generateAttestation`, `buildShareablePayload`.
- `lib/demo/canonical-hash.ts` (NEW, if needed) — deterministic canonical JSON + SHA-256.
- `components/attestation-panel.tsx` — wire generate action + copy/share.
- `components/attestation-card.tsx` (NEW or inline) — render generated attestation.
- `lib/demo/attestation.test.ts` — extend.

### Testing standards

- `vitest` for projection correctness, determinism, blocked-path error, and output whitelist. Determinism test must compare ids across repeated calls AND assert difference when a bound input mutates. [Source: lib/demo/custody-service.test.ts]
- Keep generation pure/deterministic so the Story 4.4 verify script can assert it from Node.

### Project Structure Notes

- All attestation logic stays in `lib/demo/attestation.ts`; rendering in `components/`. No `lib/domain/`. [Source: lib/demo/*]
- `generatedAt` is metadata and must be EXCLUDED from the deterministic `attestationId` canonicalization (otherwise id would not be reproducible). Document this. (AC: 3)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-selective-attestation-verifier-proof.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Custody-Chain Attestation]
- [Source: daml/Commodity/TraceabilityAttestation.daml]
- [Source: lib/demo/verifier-field-boundary.ts]
- [Source: lib/file-hash.ts]
- [Source: lib/ledger/errors.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (Cursor agent)

### Debug Log References

### Completion Notes List

- Added `generateAttestation` + `buildShareablePayload` to `lib/demo/attestation.ts` producing a deterministic, selective `TraceabilityAttestation` projection from the custody snapshot. Only verifier-shareable fields are carried; holdings/balances/counterparties are excluded.
- `attestationId` is a canonical SHA-256 hash (pure-JS implementation in `lib/demo/canonical-hash.ts`) over canonicalized JSON, so it is stable across browser and Node and changes when any bound input changes.
- Evidence references are bound to specific custody steps; the payload preserves provenance continuity end-to-end.
- `components/attestation-card.tsx` renders the shareable payload (selective fields only). The panel generate action now emits a copyable payload.
- Determinism, input-sensitivity, and serialization covered in `lib/demo/attestation.test.ts` and `lib/demo/canonical-hash.test.ts`.

### File List

- lib/demo/attestation.ts (modified)
- lib/demo/canonical-hash.ts (new)
- components/attestation-card.tsx (new)
- components/attestation-panel.tsx (modified)
- lib/demo/attestation.test.ts (modified)
- lib/demo/canonical-hash.test.ts (new)
