---
baseline_commit: b560e8ec4e24697726db988c384e4a54d71ba374
---

# Story 2.4: Ledger Gateway Boundaries for Custody Actions

Status: done

## Story

As a custody operator,
I want transfer actions to be submitted through a reliable application boundary,
so that custody state changes are authorized, traceable, and not dependent on client-only mutations.

## Acceptance Criteria

1. **Given** the user submits a create-transfer, accept-transfer, or reject-transfer action, **when** the app processes the request, **then** the browser calls a named Next.js gateway action or route rather than constructing raw Canton commands, **and** the response uses the shared success/error envelope. — **MET**
2. **Given** a Party View is active, **when** a custody action is submitted, **then** the gateway maps the UI Party View to the correct Canton party or demo equivalent, **and** unauthorized party/action combinations are rejected. — **MET**
3. **Given** custody state is returned to the UI, **when** holdings or transfer history are refreshed, **then** ledger-derived data is treated as authoritative, **and** client state stores only UI/demo state such as active Party View, filters, and transient form data. — **PARTIAL (MVP demo)**
   - **Met today:** custody mutations flow through `/api/ledger/*`; components do not construct Canton commands; `lib/demo/custody-service.ts` owns business rules server-side.
   - **Not met (deferred to Canton migration):** the client still persists `assets` + `transfers` in `localStorage` and sends a client-owned `snapshot` on each request. The gateway is a stateless validator/reducer, not the authoritative custody store. This is an intentional MVP trade-off documented below — not a claim of ledger authority.
4. **Given** the gateway returns lot, transfer, evidence, provenance event, or attestation payloads, **when** the UI consumes the response, **then** the payloads conform to documented data shapes for revealed and hidden fields, **and** client code does not infer private fields from missing or redacted data. — **MET**
5. **Given** a transfer action fails because of insufficient quantity, unauthorized party, invalid evidence, or ledger failure, **when** the UI displays the error, **then** the user sees a stable, actionable error message, **and** no private details from other parties are exposed. — **MET**
6. **Given** the current implementation still uses seeded/local demo state, **when** this story is implemented in MVP mode, **then** the code clearly separates demo adapters from future Canton-backed gateway boundaries, **and** no story depends on broad client-side custody authority as the long-term source of truth. — **MET**

## Tasks / Subtasks

- [x] Add `lib/api/response.ts` `ApiResponse<T>` envelope and `lib/api/ledger-route.ts` helpers. (AC: 1, 5)
- [x] Create gateway routes: `initiate-transfer`, `accept-transfer`, `reject-transfer`, `transfer-history`. (AC: 1, 2)
- [ ] Treat ledger-derived custody as authoritative server state; client persists UI state only. (AC: 3) — **Deferred:** requires Canton-backed store or server-side demo state; MVP uses client snapshot round-trip by design.
- [x] Centralize custody rules in `lib/demo/custody-service.ts`; UI applies gateway-returned snapshots via `applyCustodySnapshot`. (AC: 6)
- [x] Add `lib/demo/party-view-auth.ts` for Party View → operational node authorization. (AC: 2, 5)
- [x] Extend `lib/ledger/commands.ts` stubs documenting Canton vs demo adapter paths. (AC: 6)
- [x] Add `hooks/use-custody-gateway.ts` so components never mutate custody directly. (AC: 1, 6)

## Senior Developer Review (AI)

**Outcome:** Changes Requested → fixes applied for demo blockers; AC 3 remains partial by design.

**Findings addressed in this pass:**
- [x] [HIGH] Accept/reject errors were silent in `HistoryPanel` — now surfaced via `role="alert"` / `role="status"`.
- [x] [HIGH] `transfer-history` route lacked `try/catch` — now uses `ledgerRouteError`.
- [x] [MEDIUM] `addLot` used collision-prone `Date.now()` ids — now uses `nextDemoAssetId()`.
- [x] [MEDIUM] Accept merge collapsed distinct-origin lots — merge key now includes `originIdentifier`.
- [x] [LOW] Global `isSubmitting` disabled all pending rows — per-row `actionState` with "Accepting…"/"Rejecting…" labels.

**Documented, not fixed (MVP scope):**
- [ ] [HIGH] Client snapshot is source of truth; gateway authorization is advisory until Canton lands (AC 3).
- [ ] [LOW] No `cancelTransfer` for stranded pending reservations.

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `pnpm typecheck` — pass
- `pnpm lint` — pass
- `pnpm verify:custody-transfers` — pass

### Completion Notes List

- All custody mutations flow through `/api/ledger/*` with `ApiResponse` envelope.
- Demo adapter (`custody-service`) is isolated from UI; store applies validated snapshots only.
- Ledger command stubs remain for future Canton wiring.
- **AC 3 partial:** MVP persists custody in `localStorage` and round-trips `snapshot` through stateless routes. Canton migration must remove `snapshot` from request bodies and query ledger truth server-side.

### File List

- `lib/api/response.ts`
- `lib/api/ledger-route.ts`
- `app/api/ledger/initiate-transfer/route.ts`
- `app/api/ledger/accept-transfer/route.ts`
- `app/api/ledger/reject-transfer/route.ts`
- `app/api/ledger/transfer-history/route.ts`
- `lib/demo/custody-service.ts`
- `lib/demo/party-view-auth.ts`
- `hooks/use-custody-gateway.ts`
- `lib/ledger/commands.ts`
- `lib/store.ts`
- `components/traceability-view.tsx`
- `components/history-panel.tsx`
- `components/transfer-row.tsx`

### Change Log

- 2026-06-13: Story 2.4 — Ledger gateway boundaries for custody actions (demo adapter MVP).
- 2026-06-13: Party-mode review — corrected AC 3 status; fixed demo blockers (history errors, transfer-history envelope, per-row actions, provenance merge, addLot ids).
