# Bug Report: History Tab Broken After History/Requests Split

**Date:** 2026-06-13  
**Severity:** Medium — functional regression, silent data loss from UI  
**Status:** Fixed  
**Introduced by commit:** `7984c2f` — feat(ui): add top navbar shell, requests tab, and detail layout polish  
**Fixed in:** `components/history-panel.tsx`

---

## Summary

After the Requests tab was split out of the History panel in commit `7984c2f`, the History tab stopped showing an empty state for operational parties with no completed transfers. Instead, those parties saw a completely blank panel — no transfers, no empty state message, no visual feedback. The Requests tab was unaffected because it was implemented with correct state handling from the start.

---

## Root Cause

### The Stale `hasHistory` Condition

In `components/history-panel.tsx`, the `hasHistory` logic was not fully updated when pending transfers were moved to `RequestsPanel`:

**Before the split** (old code, correct at the time):
```javascript
const hasHistory =
  sent.length > 0 ||
  received.length > 0 ||
  pendingInbound.length > 0 ||   // ← pending transfers still lived here
  pendingOutbound.length > 0 ||  // ← pending transfers still lived here
  !privacyProof
```

The `|| !privacyProof` flag ensured that for every operational party, the panel body always rendered — which was important because `pendingInbound` was rendered with `emptyMessage="No transfers awaiting your decision."`, giving the user visible feedback even with zero history.

**After the split** (broken new code):
```javascript
const hasHistory = sent.length > 0 || received.length > 0 || !privacyProof
```

The `pendingInbound` and `pendingOutbound` terms were correctly removed, but `|| !privacyProof` was left behind as a stale remnant. For any operational party (`privacyProof = false`), this condition is always `true` — so `hasHistory` is always `true`.

### The Silent Blank Panel

When `hasHistory = true` but both `sent` and `received` are empty:

```jsx
<div className="space-y-6">
  <TransferSection title="Sent" transfers={[]} ... />     {/* returns null — no emptyMessage */}
  <TransferSection title="Received" transfers={[]} ... /> {/* returns null — no emptyMessage */}
</div>
```

Both `TransferSection` components short-circuit to `null` (they only show when `transfers.length > 0` OR when an `emptyMessage` is provided, and neither holds). The outer `<div className="space-y-6">` renders with zero children — a visually invisible element. The tab appears completely blank with zero height content.

---

## Affected Scenarios

| Scenario | Before fix | After fix |
|---|---|---|
| Operational party with completed transfers (demo seed data) | ✅ Shows history | ✅ Shows history |
| Operational party with NO completed transfers (fresh Canton backend, or party not in seed route) | ❌ Blank panel | ✅ "No custody history yet" empty state |
| Privacy proof party (verifier, unrelated company) | ✅ "No private transfer history visible" | ✅ "No private transfer history visible" |

**Why "requests works but history doesn't":** `RequestsPanel` explicitly handles all states with early returns before rendering `TransferSection` (checks `privacyProof`, then checks `pendingCount === 0`). The `HistoryPanel` used the `hasHistory` pattern which was correct before the split but became broken after pending transfers were removed.

---

## Code Investigation Trail

| Commit | Relevant change |
|---|---|
| `4d51aa9` (epic 1) | Introduced `visibleTransfersSentForPartyView` and `visibleTransfersReceivedForPartyView` selectors in the store — **without** a `status !== "pending"` filter |
| `6021654` (epic 2) | Added `status !== "pending"` to both sent/received selectors, AND added `visiblePendingInboundForPartyView` / `visiblePendingOutboundForPartyView` selectors. Store was ready for the split. |
| `7984c2f` (ui shell) | Split pending transfers into `RequestsPanel`. Created `requests-panel.tsx` correctly. Simplified `HistoryPanel` props — but **left `\|\| !privacyProof` stale** in the `hasHistory` condition. |
| `de4e606` (merge) | Introduced an unresolved merge conflict in `traceability-view.tsx` (briefly, parse error in dev server). |
| `d6bd4cc` (fix) | Resolved the merge conflict. App compiles cleanly. But the `hasHistory` logic bug remained. |

---

## The Fix

**File:** `components/history-panel.tsx`

Replaced the single-condition `hasHistory` pattern with explicit early returns — matching the pattern already used correctly in `RequestsPanel`:

```javascript
// Before (broken):
const hasHistory = sent.length > 0 || received.length > 0 || !privacyProof
// Single if/else with nested privacyProof check inside empty state

// After (fixed):
const hasCompletedHistory = sent.length > 0 || received.length > 0

if (privacyProof) {
  return <PrivacyEmptyState />
}

if (!hasCompletedHistory) {
  return <NoHistoryYetEmptyState />
}

return <TransferSections />
```

This makes the three distinct states (privacy proof, no history, has history) explicit and independent — eliminating the implicit `|| !privacyProof` bypass.

---

## Secondary Findings (No Fix Required)

### Store Migration Ordering
`lib/store.ts` has a `migrate()` function where the checks are ordered from **highest to lowest version** (`version < 10` is first). In Zustand's `persist` middleware, the first matching condition returns immediately, so all older versions (< 10) hit the same migration path. The `version < 9`, `version < 8`, etc. branches are **unreachable dead code**. This is harmless in practice (the `version < 10` migration is functionally correct for all older versions), but should be cleaned up to avoid confusion.

### TabsContent — No Lazy Rendering Issue
The `Tabs` component uses Radix UI primitives. Content is only rendered when the tab is active. No lazy-rendering or display-none issue was found.

### Canton Backend Data Flow
`useLedgerSync` → `/api/ledger/transfer-history` → `cantonTransferHistory` correctly returns separate `sent`, `received`, `pendingInbound`, `pendingOutbound` arrays. The hook combines them into a single `transfers` array and calls `applyCustodySnapshot`. The Zustand store selectors then split them back by status. This chain is working correctly.
