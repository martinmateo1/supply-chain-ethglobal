---
baseline_commit: 602165419bb2ae679c6ca6c7eeb66db22afb557c
---

# Story 5.4: Authoritative Ledger State in the UI (Close AC 2.4.3)

Status: ready-for-dev

## Story

As a custody operator,
I want holdings and transfer history to be read from Canton rather than from a client snapshot,
so that the ledger — not `localStorage` — is the source of truth (closing the deferred Story 2.4 AC 3).

## Acceptance Criteria

1. Given the Canton backend is active, when the UI loads or refreshes holdings and history, then data is fetched from the Canton-backed gateway and treated as authoritative, and the client no longer sends a custody `snapshot` in request bodies for the Canton path.
2. Given the client store currently persists `assets` + `transfers`, when the Canton backend is active, then Zustand/`localStorage` retains only UI/demo state (active Party View, filters, transient form data), and custody quantities are never read from client persistence as truth.
3. Given a transfer is accepted by the recipient Party View, when the sender and recipient refresh, then both see ledger-consistent holdings and history reflecting the move, and an unrelated Party View cannot see the transfer or infer it from totals.
4. Given the epic vertical slice is complete, when the happy path (create lot → transfer → accept) and the double-spend negative are exercised end-to-end against Canton, then both behave correctly through the running app, and Story 2.4 AC 3 can be marked MET for the Canton path with the demo adapter retained only as a flagged fallback.

## Tasks / Subtasks

- [ ] Add a read path: holdings + history fetched from the Canton-backed gateway (`transfer-history` already exists; add a holdings/visible-lots read if missing). (AC: 1)
- [ ] In `hooks/use-custody-gateway.ts`, stop sending the client `snapshot` for the Canton backend; apply ledger-returned state instead. (AC: 1)
- [ ] Refactor `lib/store.ts` so that under the Canton backend it holds only UI/demo state (active Party View, filters, transient form). Gate `persist` of `assets`/`transfers` so custody is not read as truth from `localStorage`. (AC: 2)
- [ ] Ensure visibility selectors derive from ledger-returned data, preserving non-involved-party privacy. (AC: 3)
- [ ] End-to-end verify against `dpm sandbox`: create lot → transfer (with evidence) → accept; confirm both parties see consistent state and an unrelated Party View sees nothing. (AC: 3, 4)
- [ ] Run the double-spend negative end-to-end through the app and confirm it is blocked. (AC: 4)
- [ ] Update Story 2.4 record: mark AC 3 MET for the Canton path; note demo adapter is now a flagged fallback. (AC: 4)

## Dev Notes

### Dependencies

- **Blocked by 5.3** (Canton-backed gateway). This story closes the AC 3 gap explicitly deferred in Story 2.4.

### Why This Story Exists

- Story 2.4 AC 3 is **PARTIAL (MVP demo)**: the client persists `assets` + `transfers` in `localStorage` and round-trips a `snapshot` through stateless routes, so the gateway is a validator/reducer, not the authoritative store. See `2-4-ledger-gateway-boundaries-for-custody-actions.md` AC 3 and Completion Notes. This story removes the client snapshot for the Canton path and makes the ledger authoritative.

### Current State (verified)

- `lib/store.ts` (Zustand + `persist`, version 10) holds `assets` and `transfers` and exposes `applyCustodySnapshot`, visibility selectors, and `availableQuantityForAsset`.
- `hooks/use-custody-gateway.ts` builds a `snapshot` (via `getSnapshot`) and posts it to `/api/ledger/*`, then applies the returned snapshot.
- `lib/provenance.ts` gates asset visibility on `status === "accepted"`; keep parity with ledger-derived data.

### Design Notes

- Keep `localStorage` ONLY for UI/demo state (active Party View, filters, transient form data) — explicitly allowed by the architecture's client-state decision. Under `LEDGER_BACKEND=demo`, prior behavior may remain so the offline demo still works.
- Treat ledger data as authoritative: components render from gateway responses; never reconstruct custody quantity from client persistence under the Canton backend.
- Preserve selective privacy: a non-involved Party View must not see or infer transfers (re-verify with the existing privacy scripts).

### Testing Requirements

- `pnpm lint`, `pnpm typecheck` pass.
- Reuse/extend `scripts/verify-party-visibility.ts` to assert non-involved privacy against ledger-derived data.
- Manual E2E against `dpm sandbox` for happy path + double-spend (AC 4).

### References

- `_bmad-output/planning-artifacts/epics/epic-5-canton-ledger-integration.md`
- `_bmad-output/implementation-artifacts/2-4-ledger-gateway-boundaries-for-custody-actions.md` (AC 3 deferral this story closes)
- `lib/store.ts`, `hooks/use-custody-gateway.ts`, `lib/provenance.ts`, `scripts/verify-party-visibility.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
