---
baseline_commit: 679dea508f4bf16f4e54fdb200a6de8c9245e1b5
---

# Story 1.4: Origin Evidence and Certification Metadata

Status: done

## Story

As a production-site operator,
I want to attach origin evidence and structured certifications while creating a Lot Position,
so that downstream custodians and attestations can reference the origin proof without storing raw private files on-ledger.

## Acceptance Criteria

1. Given the Create Lot panel is open, when the user adds origin evidence, then the UI accepts supported document files or metadata references, and each evidence item records document name, document type, hash or content identifier, issuer when available, and timestamp.
2. Given an evidence file is selected, when the file is processed, then the app computes or records a stable evidence hash/reference before lot creation, and the UI shows a readable evidence card with a mono hash/reference preview.
3. Given the user selects certification labels, when the origin lot is created, then the selected certifications are stored as structured metadata, and the certifications appear consistently in holdings and asset detail views.
4. Given an origin lot has evidence and certification metadata, when the lot is transferred, split, combined, or attested later, then the origin metadata remains available for provenance and attestation workflows, and certification metadata is not downgraded to free-text-only copy.
5. Given evidence files stay off-ledger in the MVP, when lot creation is submitted, then only evidence references, hashes, or content identifiers are bound to custody state, and raw document access is not exposed to unrelated Party Views.

## Tasks / Subtasks

- [x] Reuse evidence upload in Create Lot panel. (AC: 1, 2)
  - [x] Integrate `components/certificate-dropzone.tsx` into `components/create-lot-panel.tsx` (from Story 1.3) with origin-specific label copy ("Origin certificate" / "Origin evidence").
  - [x] Reuse `hashFile` from `lib/file-hash.ts`; do not upload raw files to Canton or expose file blobs in store.
- [x] Extend evidence type for origin context. (AC: 1, 5)
  - [x] Add `OriginEvidenceReference` type (or extend `TransferAttachment` with optional `documentType`, `issuer`, `timestamp`) in `lib/types.ts`.
  - [x] Store evidence references on the `Asset` as `originEvidence?: OriginEvidenceReference[]` — off-ledger binding only.
- [x] Render evidence cards in create-lot summary and detail views. (AC: 2, 3)
  - [x] Show evidence cards in create-lot confirmation summary (mirror transfer panel summary block).
  - [x] Display origin evidence section on `components/asset-detail-view.tsx` for authorized parties with mono hash preview (truncate + copy-friendly per UX accessibility floor).
- [x] Persist certifications and evidence through lot creation. (AC: 3, 4, 5)
  - [x] Update `addLot` in `lib/store.ts` to accept certifications array and origin evidence references.
  - [x] Ensure `addTransfer` preserves source asset certifications and carries forward origin evidence metadata on derived assets (copy `originEvidence` and `originIdentifier` when splitting/creating destination asset).
- [x] Verify holdings and detail consistency. (AC: 3, 4)
  - [x] Confirm `components/asset-row.tsx` and asset detail show certification badges from structured `certifications` array (already uses `CERTIFICATION_META`).
  - [x] Confirm non-involved party cannot see origin evidence on blocked or invisible assets.

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `pnpm typecheck` — pass
- `pnpm lint` — pass

### Completion Notes List

- Added `OriginEvidenceReference` type and `originEvidence` on Asset; only hashes/metadata stored, no raw files.
- Create Lot panel integrates CertificateDropzone with origin-specific copy; summary shows hash count.
- Asset detail shows Origin evidence references section for authorized parties only (after visibility gate).
- `addTransfer` preserves `originIdentifier` and `originEvidence` on derived/combined assets.

### File List

- `components/create-lot-panel.tsx`
- `components/certificate-dropzone.tsx`
- `components/asset-detail-view.tsx`
- `lib/types.ts`
- `lib/store.ts`

### Change Log

- 2026-06-13: Story 1.4 — Origin evidence references on lot creation, detail view section, transfer metadata preservation.
