---
baseline_commit: 679dea508f4bf16f4e54fdb200a6de8c9245e1b5
---

# Story 1.3: Origin Lot Creation Panel

Status: done

## Story

As a production-site operator,
I want to create a certified commodity Lot Position from the dashboard,
so that the custody chain starts with structured origin, quantity, quality, and certification data.

## Acceptance Criteria

1. Given the active Party View is a production-site Operational Node, when the user views the dashboard actions, then a Create Lot action is available, and the action opens a side panel consistent with the existing transfer panel pattern.
2. Given the Create Lot panel is open, when the user fills the lot form, then the form captures Commodity, quantity, unit, origin identifier or coordinates, quality grade, certification labels, and current Operational Node, and coffee beans and cacao are available as seeded Commodity options.
3. Given the user enters invalid lot data, when required fields are missing or quantity is not positive, then the Create Lot confirmation is disabled or blocked, and inline validation explains what must be corrected.
4. Given the user reviews a valid origin lot form, when the user confirms creation, then a new Lot Position is created for the active production-site Party View, and the lot appears in that party's holdings with commodity, quantity, unit, grade, and certification metadata.
5. Given an origin Lot Position has been created, when another unrelated Party View is selected, then the new lot is not visible to the unrelated party, and the non-involved privacy proof state remains accurate.
6. Given the origin lot has structured Commodity and certification metadata, when the lot is later used by transfer or attestation workflows, then the metadata is available for preservation through downstream custody events, and the implementation does not hard-code behavior to coffee or cacao only.

## Tasks / Subtasks

- [x] Add Create Lot action for production-site Party View only. (AC: 1)
  - [x] In `components/traceability-view.tsx`, show a "Create Lot" button when `selectedPartyView.companyRole === "producer"` and `operationalNodeId === "production-site"`.
  - [x] Reuse the sliding side-panel layout from the transfer panel (`transferOpen` pattern); only one mutating panel open at a time.
- [x] Implement `components/create-lot-panel.tsx`. (AC: 1, 2, 3, 4)
  - [x] Mirror `components/transfer-panel.tsx` structure: header, form fields, summary block, confirm button, success state.
  - [x] Fields: Commodity select (coffee/cacao from `COMMODITY_META`), quantity (positive number, tons), origin identifier or coordinates (text), quality grade (A/B/C from `RATING_META`), certification multi-select (non-gmo, deforestation-free), read-only current Operational Node.
  - [x] Disable confirm until commodity, positive quantity, grade, at least one certification, and origin identifier are present.
- [x] Extend domain types for origin metadata. (AC: 2, 6)
  - [x] Add optional `originIdentifier?: string` on `Asset` in `lib/types.ts` (maps to Lot Position origin field for MVP demo state).
  - [x] Keep commodity-generic: use `CommodityType` and certification arrays, not coffee/cacao-specific branches beyond seeded options.
- [x] Add store action for lot creation. (AC: 4, 5)
  - [x] Add `addLot` (or `createLotPosition`) to `lib/store.ts` that appends a new `Asset` at the production-site operational node.
  - [x] Generate stable demo id (e.g. `a${Date.now()}`); set `accountId` to active operational node id.
  - [x] Do not expose the new asset to non-involved or unrelated parties — rely on existing `isAssetVisibleToParty` (holder-only until transfer).
- [x] Wire ledger boundary stub for future gateway. (AC: 4)
  - [x] Extend `CreateLotCommand` in `lib/ledger/commands.ts` with origin, grade, certifications when adding the demo store path; keep throwing `LEDGER_NOT_CONFIGURED` until `app/api/ledger/create-lot/route.ts` lands.
  - [x] Document in dev notes that demo store is interim until gateway replaces it.
- [x] Verify privacy and holdings display. (AC: 4, 5)
  - [x] Confirm new lot appears in Assets tab for Origin Cooperative Party View only until transferred.
  - [x] Switch to Atlas Commodities (non-involved) and confirm zero holdings and privacy-proof empty state unchanged.

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `pnpm typecheck` — pass
- `pnpm lint` — pass
- `pnpm verify:party-visibility` — pass

### Completion Notes List

- Added production-site-only Create Lot button and side panel mirroring transfer panel UX.
- `addLot` store action creates holder-only demo lot positions with structured commodity, grade, certifications, and origin identifier.
- Extended `CreateLotCommand` type for future ledger gateway; demo path remains Zustand-backed.

### File List

- `components/create-lot-panel.tsx`
- `components/traceability-view.tsx`
- `lib/store.ts`
- `lib/types.ts`
- `lib/ledger/commands.ts`

### Change Log

- 2026-06-13: Story 1.3 — Create Lot panel, addLot store action, origin metadata on Asset, ledger command stub.
