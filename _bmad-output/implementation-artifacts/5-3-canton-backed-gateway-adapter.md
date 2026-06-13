---
baseline_commit: 602165419bb2ae679c6ca6c7eeb66db22afb557c
---

# Story 5.3: Canton-Backed Gateway Adapter Behind a Feature Flag

Status: review

## Story

As a custody operator,
I want the existing `/api/ledger/*` routes to talk to Canton when enabled,
so that custody actions are submitted to the ledger without changing the frontend contract.

## Acceptance Criteria

1. Given the demo adapter currently serves custody actions, when a `LEDGER_BACKEND` feature flag is introduced (`demo` default, `canton` opt-in), then `LEDGER_BACKEND=canton` routes `initiate-transfer`, `accept-transfer`, `reject-transfer`, and `transfer-history` through `lib/ledger/*` to Canton, and `LEDGER_BACKEND=demo` keeps the existing `lib/demo/custody-service.ts` behavior unchanged.
2. Given the Canton client is needed, when `lib/ledger/client.ts`, `commands.ts`, and `queries.ts` are implemented, then they submit/query via the Canton JSON API (or chosen driver) using `CANTON_LEDGER_HOST`/`CANTON_LEDGER_ID`, and `lib/ledger/mappers.ts` converts ledger payloads to the existing UI domain types and `ApiResponse<T>` envelope.
3. Given an active Party View, when a custody action is submitted via the Canton backend, then the gateway maps the Party View to the correct Canton party, and unauthorized party/action combinations are rejected by ledger authorization and surfaced as stable `ApiResponse` errors.
4. Given a Canton submission fails (insufficient quantity, unauthorized, contention, ledger unavailable), when the route returns, then the failure is mapped to a stable error code via `lib/ledger/errors.ts`, and no private cross-party details leak in the error response.

## Tasks / Subtasks

- [x] Add `LEDGER_BACKEND` resolution (`demo` | `canton`, default `demo`) in a single server-side helper. (AC: 1)
- [x] Implement `lib/ledger/client.ts`: real Canton JSON API client (currently throws `LEDGER_NOT_CONFIGURED`). (AC: 2)
- [~] Implement `lib/ledger/commands.ts` `initiateTransfer` / `acceptTransfer` / `rejectTransfer` against generated bindings from Story 5.2. **`createLot` remains an intentional stub** (no AC in this story routes create-lot; the UI's create-lot panel is hidden under Canton — see Story 5.4 Known Limitations). (AC: 1, 2, 3)
- [x] Implement `lib/ledger/queries.ts` `visibleHoldings` / `transferHistory` (currently `never` stubs) as Party View-aware reads. (AC: 2, 3)
- [x] Implement `lib/ledger/mappers.ts` to convert Canton contract payloads ↔ `lib/types.ts` shapes. (AC: 2)
- [x] Map Party View → Canton party using the config/party-hints from Story 5.2. (AC: 3)
- [x] Switch each `app/api/ledger/*` route to dispatch on `LEDGER_BACKEND`, keeping the `ApiResponse` envelope and `ledgerRouteError` mapping. (AC: 1, 4)
- [x] Extend `lib/ledger/errors.ts` with Canton-failure → stable code mapping (insufficient quantity, unauthorized, contention, unavailable). (AC: 4)

## Dev Agent Record

### Agent Model Used

Composer

### Completion Notes List

- Added `lib/ledger/backend.ts`, `gateway.ts`, `canton-custody-service.ts`, `party-config.ts`.
- Canton JSON API v2 client uses `submit-and-wait-for-transaction` and `active-contracts`.
- Demo path unchanged; `pnpm verify:custody-transfers` passes.
- Canton scripts `ledger:verify-demo-flow` and `ledger:attempt-double-spend` pass against running sandbox.

### File List

- lib/ledger/backend.ts
- lib/ledger/client.ts
- lib/ledger/commands.ts
- lib/ledger/queries.ts
- lib/ledger/mappers.ts
- lib/ledger/errors.ts
- lib/ledger/gateway.ts
- lib/ledger/canton-custody-service.ts
- lib/ledger/party-config.ts
- app/api/ledger/initiate-transfer/route.ts
- app/api/ledger/accept-transfer/route.ts
- app/api/ledger/reject-transfer/route.ts
- app/api/ledger/transfer-history/route.ts
- app/api/ledger/visible-holdings/route.ts
- app/api/ledger/config/route.ts
- scripts/verify-demo-flow.ts
- scripts/attempt-double-spend.ts

### Change Log

- 2026-06-13: Canton-backed gateway adapter behind `LEDGER_BACKEND` feature flag.
