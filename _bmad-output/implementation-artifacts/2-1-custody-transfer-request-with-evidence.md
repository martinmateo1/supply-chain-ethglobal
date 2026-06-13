---
baseline_commit: b560e8ec4e24697726db988c384e4a54d71ba374
---

# Story 2.1: Custody Transfer Request with Evidence

Status: done

## Story

As a sending custody operator,
I want to initiate a Custody Transfer for a selected quantity with supporting evidence,
so that a downstream party can receive a specific commodity quantity with proof bound to the handoff.

## Acceptance Criteria

1. Given the active Party View holds at least one visible Lot Position, when the user opens the Transfer side panel, then the panel shows sender, selectable source Lot Position, quantity, destination Operational Node, evidence upload/reference, and review summary, and the side panel follows the existing dashboard interaction pattern.
2. Given the user selects a source Lot Position, when the user enters transfer details, then the transfer records source Operational Node, destination Operational Node, Commodity, quantity, unit, timestamp intent, and source provenance reference, and the selected quantity cannot exceed available quantity.
3. Given the user attaches evidence, when the transfer request is reviewed, then each Evidence Reference includes document name, document type, hash or content identifier, issuer when available, and timestamp, and raw file contents are not treated as ledger custody state.
4. Given the transfer request is valid, when the sender confirms, then the system creates a pending Custody Transfer visible to the sender and intended recipient, and unrelated Party Views cannot see the pending transfer details or evidence references.
5. Given a transfer request is pending, when the sender attempts to spend the same pending quantity again, then the system blocks double-spending of the reserved quantity, and the UI explains that the quantity is locked by a pending inbound transfer.
6. Given the transfer submission fails validation or ledger/API processing, when the error is displayed, then the user sees an actionable message without private details leaking to unrelated parties, and the source Lot Position remains unchanged until the transfer can be accepted.

## Tasks / Subtasks

- [x] Extend `Transfer` type with `status`, `createdAt`, `sourceProvenanceRef`, and enriched `TransferAttachment` metadata. (AC: 2, 3)
- [x] Implement `lib/demo/custody-service.ts` `initiateTransfer` with quantity reservation and evidence normalization. (AC: 2, 3, 4, 5)
- [x] Wire `TransferPanel` to `useCustodyGateway` → `/api/ledger/initiate-transfer`; show pending success state and locked-quantity copy. (AC: 1, 4, 5, 6)
- [x] Add `availableQuantityForAsset` to store using custody-service reservation math. (AC: 5)
- [x] Add `scripts/verify-custody-transfers.ts` double-spend guard test. (AC: 5)

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `pnpm typecheck` — pass
- `pnpm lint` — pass
- `pnpm verify:custody-transfers` — pass

### Completion Notes List

- Transfers now start in `pending` status; source quantity is reserved until accept/reject.
- Gateway validates party authorization and returns stable error messages.
- Transfer panel shows available vs locked quantity and pending confirmation copy.

### File List

- `lib/types.ts`
- `lib/demo/custody-service.ts`
- `lib/demo/party-view-auth.ts`
- `lib/api/response.ts`
- `lib/api/ledger-route.ts`
- `app/api/ledger/initiate-transfer/route.ts`
- `hooks/use-custody-gateway.ts`
- `components/transfer-panel.tsx`
- `lib/store.ts`
- `lib/data.ts`
- `lib/seed-transfer-assets.ts`
- `scripts/verify-custody-transfers.ts`

### Change Log

- 2026-06-13: Story 2.1 — Pending custody transfer request with evidence via ledger gateway.
