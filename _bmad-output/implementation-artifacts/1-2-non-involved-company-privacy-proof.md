---
baseline_commit: 679dea508f4bf16f4e54fdb200a6de8c9245e1b5
---

# Story 1.2: Non-Involved Company Privacy Proof

Status: done

## Story

As a demo operator,
I want to switch to a non-involved company Party View,
so that I can prove unrelated parties cannot see private commodity holdings, custody transfers, evidence, or attestations.

## Acceptance Criteria

1. Given the demo Party Views are available, when the user opens the Party View selector, then a non-involved company Party View is available, and it is clearly labeled as unrelated to the active custody route.
2. Given the non-involved company Party View is selected, when the user opens the Assets tab, then the dashboard shows a privacy proof empty state instead of generic "no assets" copy, and the empty state explains that no private Lot Positions are visible to this company.
3. Given the non-involved company Party View is selected, when the user opens the History tab, then no private Custody Transfers or Evidence References from the custody route are shown, and the empty state explains that no private transfer history is visible to unrelated parties.
4. Given the non-involved company Party View is selected, when the user attempts to open a known involved-party asset detail URL, then the asset detail route blocks access with a privacy-focused message, and the message explains that Canton visibility is limited to involved custodians and counterparties.
5. Given the non-involved company Party View is selected, when the dashboard renders visible totals, then the visible commodity quantity for the demo custody route is zero, and no previous involved-party holdings remain visible after switching.
6. Given attestations or verifier views exist for the demo custody route, when the non-involved company Party View is active, then the unrelated company cannot inspect hidden counterparties, custody-route quantities, private evidence, or attestation details beyond explicitly shared verifier fields, and no aggregate or empty-state copy implies hidden private values.
7. Given the privacy proof state is displayed, when a judge reviews the screen, then the UI communicates that the empty state is expected selective visibility behavior, and it does not imply a loading failure, missing data error, or broken demo.

## Tasks / Subtasks

- [x] Add the non-involved Party View fixture. (AC: 1, 5)
  - [x] Add a company/party with no entitlement to route holdings, transfers, evidence, or attestations.
  - [x] Ensure selector totals show zero for the custody route and do not leak aggregate private quantities.
- [x] Replace generic empty states for the non-involved party. (AC: 2, 3, 7)
  - [x] Update `components/assets-panel.tsx` with a privacy-proof empty state.
  - [x] Update `components/history-panel.tsx` with a privacy-proof empty state.
  - [x] Use operator-language copy: "No private contracts are visible to this company."
- [x] Harden asset detail privacy gating. (AC: 4)
  - [x] Review `components/asset-detail-view.tsx` unauthorized state and align copy with the privacy proof.
  - [x] Ensure the route does not show hidden transfer/evidence details before or after the blocked state renders.
- [x] Prepare attestation/verifier privacy constraints for later stories. (AC: 6)
  - [x] Document or stub the allowed verifier-field boundary so future attestation work does not backfill private dashboard state.

## Dev Notes

### Current Implementation Context

- `lib/data.ts` currently lacks a non-involved company, so Story 1.1/1.2 must extend the seeded party set.
- `components/assets-panel.tsx` currently uses generic "No assets in this account" copy.
- `components/history-panel.tsx` currently uses generic "No history yet" copy.
- `components/asset-detail-view.tsx` already blocks non-visible assets with a Canton privacy message; this should be sharpened for the non-involved proof.
- `lib/store.ts` persists selected party and data in localStorage. Switching to the non-involved party must not leave previous-party rows visible.

### Architecture Guardrails

- Treat any private record visible to the non-involved company as a blocker.
- Do not reveal hidden quantities through totals, aggregate copy, counters, disabled controls, or "there is hidden data" wording.
- The verifier exception in later stories is selective proof only; it must not become broad access to holdings or transfers.

### Previous Story Dependency

- Story 1.1 should establish Party View metadata and a visibility matrix. If it is not complete, implement the smallest fixture extension needed here without duplicating incompatible party models.

### Testing Requirements

- Add a manual or automated check that non-involved Assets and History tabs show no custody data and use privacy-proof copy.
- Verify direct navigation to `/assets/[id]` for an involved-party lot remains blocked for the non-involved party.
- Run `pnpm lint` and `pnpm typecheck`.

### References

- `_bmad-output/planning-artifacts/epics/epic-1-private-party-dashboard-origin-lot-creation.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hackaton-2026-06-13/EXPERIENCE.md`
- `_bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `components/assets-panel.tsx`
- `components/history-panel.tsx`
- `components/asset-detail-view.tsx`

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `pnpm typecheck` — pass
- `pnpm lint` — pass (pre-existing warnings only)
- `pnpm verify:party-visibility` — pass; non-involved-company holdings=0 sent=0 received=0 evidence=0

### Completion Notes List

- Wired dashboard to `DEMO_PARTY_VIEWS` with Atlas Commodities Trading labeled `(unrelated)` in the Party View selector and `0t` visible totals.
- Added `isPrivatePartyView`, `isTransferVisibleToParty`, and `visibleEvidenceCountForParty` to `lib/provenance.ts`; store now filters holdings/history by party entitlement via `selectedPartyViewId`.
- Privacy-proof empty states in Assets/History panels use operator copy and explain expected Canton selective visibility.
- Sharpened asset detail blocked state; visibility gate runs before any transfer/evidence rendering.
- Added `lib/demo/verifier-field-boundary.ts` stub for Epic 4 attestation boundaries.

### File List

- `components/assets-panel.tsx`
- `components/history-panel.tsx`
- `components/traceability-view.tsx`
- `components/asset-detail-view.tsx`
- `lib/provenance.ts`
- `lib/store.ts`
- `lib/demo/verifier-field-boundary.ts`
- `package.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-06-13: Implemented non-involved company privacy proof — Party View selector, privacy empty states, asset detail gating, verifier field boundary stub, and party-aware store filtering.
