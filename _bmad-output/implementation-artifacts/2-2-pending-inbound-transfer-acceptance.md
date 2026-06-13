---
baseline_commit: b560e8ec4e24697726db988c384e4a54d71ba374
---

# Story 2.2: Pending Inbound Transfer Acceptance

Status: review

## Story

As a destination custody operator,
I want to accept or reject pending inbound Custody Transfers,
so that custody only changes hands when the receiving party explicitly acts.

## Acceptance Criteria

1. Given a pending Custody Transfer targets the active Party View, when the destination operator opens the dashboard or History tab, then the pending inbound transfer is shown in a distinct pending section, and the operator can inspect commodity, quantity, sender, destination, evidence count, and source provenance summary.
2. Given a pending transfer is visible to the destination operator, when the operator accepts it, then the destination Lot Position is created or updated, and the source Lot Position is archived, reduced, or otherwise updated according to the custody model.
3. Given custody state is pending, when any party other than the intended destination attempts to accept the transfer, then the action is rejected, and only the current custodian can initiate further transfers after acceptance.
4. Given a pending transfer is visible to the destination operator, when the operator rejects it, then custody does not move to the destination party, and the sender and recipient can see the rejected status only if they are entitled to that transfer.
5. Given an unrelated Party View is active, when pending transfers exist between other parties, then the unrelated party cannot see, accept, reject, or infer the pending transfer.
6. Given a transfer has already been accepted or rejected, when either party tries to repeat the same action, then the system prevents duplicate state transitions, and the UI explains the current transfer status.
7. Given the transfer state is pending, accepted, rejected, or cancelled, when the UI renders available actions, then only state-valid actions are enabled, and rejected or cancelled transfers do not change destination custody or available source balance.

## Tasks / Subtasks

- [x] Implement `acceptTransfer` and `rejectTransfer` in `lib/demo/custody-service.ts`. (AC: 2, 3, 4, 6, 7)
- [x] Add `/api/ledger/accept-transfer` and `/api/ledger/reject-transfer` routes. (AC: 3)
- [x] Extend store with `visiblePendingInboundForPartyView` / `visiblePendingOutboundForPartyView`. (AC: 1, 5)
- [x] Update `HistoryPanel` with pending sections and accept/reject actions on inbound rows. (AC: 1, 7)
- [x] Wire `traceability-view.tsx` to custody gateway accept/reject handlers. (AC: 1, 2, 4)

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `pnpm verify:custody-transfers` — accept/reject path pass

### Completion Notes List

- Accept moves quantity to destination and marks transfer `accepted`.
- Reject releases reservation without mutating holdings.
- Pending inbound section shows accept/reject only for entitled destination Party View.

### File List

- `lib/demo/custody-service.ts`
- `app/api/ledger/accept-transfer/route.ts`
- `app/api/ledger/reject-transfer/route.ts`
- `hooks/use-custody-gateway.ts`
- `components/history-panel.tsx`
- `components/transfer-row.tsx`
- `components/traceability-view.tsx`
- `lib/store.ts`
- `lib/provenance.ts`

### Change Log

- 2026-06-13: Story 2.2 — Pending inbound accept/reject workflow.
