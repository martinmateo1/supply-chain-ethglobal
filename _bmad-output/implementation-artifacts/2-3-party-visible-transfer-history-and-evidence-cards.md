---
baseline_commit: b560e8ec4e24697726db988c384e4a54d71ba374
---

# Story 2.3: Party-Visible Transfer History and Evidence Cards

Status: review

## Story

As an involved custody operator,
I want to inspect sent and received transfer history with evidence references,
so that I can understand the custody events visible to my Party View.

## Acceptance Criteria

1. Given the active Party View has completed transfers, when the user opens the History tab, then sent and received transfers are grouped clearly, and each transfer row shows counterparty, commodity, quantity, unit, date, status, certification labels, and evidence count.
2. Given a transfer includes Evidence References, when the transfer row or related detail view is inspected, then evidence cards show human-readable document meaning before hashes, and hashes or content identifiers use mono typography and are selectable or copyable where practical.
3. Given the active Party View is not involved in a transfer, when transfer history is rendered, then the transfer and its evidence references are not shown, and aggregate totals do not reveal private activity.
4. Given the user opens an asset detail page for a visible Lot Position, when related custody activity is listed, then only transfers visible to the selected Party View are displayed, and the visibility explanation remains consistent with the dashboard.
5. Given no transfer history is visible, when the History tab renders, then the empty state distinguishes between no activity yet and no activity visible because of selective privacy, and the copy does not imply a broken data load.

## Tasks / Subtasks

- [x] Add status badges and evidence count to `TransferRow`; group sent/received/pending in `HistoryPanel`. (AC: 1)
- [x] Create `components/evidence-reference-list.tsx` with document type labels and mono hashes. (AC: 2)
- [x] Expandable evidence section on transfer rows. (AC: 2)
- [x] Keep privacy empty states and visibility filters from Epic 1; exclude non-involved parties from pending/completed transfers. (AC: 3, 5)
- [x] Update `asset-detail-view.tsx` date handling for `occurredAt ?? createdAt`. (AC: 4)

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `pnpm verify:party-visibility` — pass

### Completion Notes List

- History tab shows Pending inbound/outbound plus completed Sent/Received sections.
- Evidence cards lead with document name and type; content IDs are mono and select-all.
- Asset detail custody timeline uses normalized transfer timestamps.

### File List

- `components/evidence-reference-list.tsx`
- `components/transfer-row.tsx`
- `components/history-panel.tsx`
- `components/asset-detail-view.tsx`
- `lib/demo/visibility-matrix.ts`

### Change Log

- 2026-06-13: Story 2.3 — Transfer history grouping and evidence cards.
