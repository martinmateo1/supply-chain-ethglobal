# Report: Sent & Received Transfers Not Visible in History

**Date:** 2026-06-13  
**Severity:** High — core user workflow broken, transfers invisible after initiation  
**Status:** Fixed  
**Related report:** `history-panel-regression-report.md` (prior blank-panel regression)  
**Files changed:** `components/history-panel.tsx`, `components/requests-panel.tsx`, `components/traceability-view.tsx`

---

## Summary

After a user initiates a custody transfer, the transfer does not appear in the History tab. The History tab remains empty (or shows only old seed data) while the newly initiated transfer is silently visible only in the Requests tab — a tab the *sender* has no reason to check. This makes it appear as if the transfer was lost.

Additionally, **received** transfers from the counterparty accepting an inbound request are only visible to the receiving party after acceptance, and only as "completed" history — there is no in-flight visibility for the receiver either.

Both issues stem from the same design decision: when the History/Requests split was introduced, **pending outbound transfers were placed exclusively in `RequestsPanel`**, which was semantically correct from a "tasks requiring action" standpoint but incorrect from the user's perspective of "my activity log."

---

## Data Flow: Where Transfers Live

The Zustand store exposes four filtered selectors:

| Selector | Status filter | Direction filter | Used by |
|---|---|---|---|
| `visibleTransfersSentForPartyView` | `status !== "pending"` | `fromAccountId === actorId` | `HistoryPanel` |
| `visibleTransfersReceivedForPartyView` | `status !== "pending"` | `toAccountId === actorId` | `HistoryPanel` |
| `visiblePendingInboundForPartyView` | `status === "pending"` | `toAccountId === actorId` | `RequestsPanel` |
| `visiblePendingOutboundForPartyView` | `status === "pending"` | `fromAccountId === actorId` | `RequestsPanel` (before fix) |

When a user initiates a transfer:

1. `custodyService.initiateTransfer` creates a new transfer with `status: "pending"`.
2. `applyCustodySnapshot` updates the store.
3. `visiblePendingOutboundForPartyView` picks it up — `status === "pending"`, `from === actor`.
4. `visibleTransfersSentForPartyView` **does not** pick it up — it explicitly excludes `status === "pending"`.

**Result:** The transfer is only visible to `RequestsPanel`, which shows pending inbound transfers for action. The sender is looking at History and sees nothing new.

---

## Why the Sender Looks at History, Not Requests

The tabs were semantically named "Requests" and "History":

- **Requests** = transfers requiring the current party to take action (accept or reject an inbound request).
- **History** = the record of what this party has done.

From the **sender's point of view**, a transfer they just initiated is *their* activity — it is something they did. They naturally look in History. Requests is the "inbox"; History is the "sent items + timeline."

Placing `pendingOutbound` in `RequestsPanel` made sense from a pure data-model perspective (it is pending) but was wrong from a user mental model perspective (it is something I initiated, not something I need to act on).

---

## The Specific Blank Panel Scenario

For a user who has **only initiated transfers** (no accepted/rejected transfers yet):

```
visibleSent        = []   (all pending, filtered out by status !== "pending")
visibleReceived    = []   (no inbound accepted transfers yet)
pendingOutbound    = [t_new]  (but this was in RequestsPanel, not HistoryPanel)
```

`HistoryPanel` received `sent=[]`, `received=[]`. The `hasActivity` check (at the time) was:

```javascript
const hasCompletedHistory = sent.length > 0 || received.length > 0
// = false

if (!hasCompletedHistory) {
  return <NoHistoryYetEmptyState />  // ← "No custody history yet" shown
}
```

So the user saw "No custody history yet" even though they just sent a transfer seconds ago. The transfer existed — it was just invisible in the wrong tab.

---

## Transfer Lifecycle & Visibility Gap

```
Sender initiates transfer
        │
        ▼
status = "pending"
        │
        ├── Visible in RequestsPanel (pendingOutbound)  ← sender can't see
        └── NOT visible in HistoryPanel (filtered out)  ← sender is looking here
        │
Counterparty accepts
        │
        ▼
status = "accepted"
        │
        ├── Visible in HistoryPanel.sent               ✓ sender sees it now
        └── Visible in HistoryPanel.received            ✓ receiver sees it now
```

The gap exists during the entire `pending` phase — from initiation until counterparty action. For workflows where acceptance is not immediate (human in the loop), this can be minutes to days.

---

## The Fix

### Semantic redefinition of tabs

| Tab | Before fix | After fix |
|---|---|---|
| **Requests** | Pending inbound + pending outbound | Pending inbound only (inbox — requires action) |
| **History** | Completed sent + completed received | Pending outbound + completed sent + completed received |

This aligns with established email/messaging conventions: "Sent Items" shows everything you sent, regardless of whether the recipient has read it.

### `components/history-panel.tsx`

Added `pendingOutbound: Transfer[]` to `HistoryPanelProps` and updated the activity check and sections:

```typescript
// Props (added)
type HistoryPanelProps = {
  sent: Transfer[]
  received: Transfer[]
  pendingOutbound: Transfer[]   // ← new
  accountNameById: (id: string) => string
  privacyProof?: boolean
}

// Activity check (updated)
const hasActivity =
  sent.length > 0 || received.length > 0 || pendingOutbound.length > 0
  //                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^ new

// Sections (added, rendered first — most recent activity)
<TransferSection
  title="Sent — awaiting counterparty"
  transfers={pendingOutbound}
  direction="sent"
  accountNameById={accountNameById}
/>
<TransferSection title="Sent" transfers={sent} ... />
<TransferSection title="Received" transfers={received} ... />
```

`TransferSection` already returns `null` when `transfers` is empty and no `emptyMessage` is passed — so the "awaiting counterparty" heading only appears when there are actually pending outbound transfers.

### `components/requests-panel.tsx`

Removed `pendingOutbound` entirely:

```typescript
// Removed from RequestsPanelProps
pendingOutbound: Transfer[]

// Removed from render output
<TransferSection title="Sent — awaiting counterparty" transfers={pendingOutbound} ... />

// Updated count (no longer includes pendingOutbound)
const pendingCount = pendingInbound.length
```

### `components/traceability-view.tsx`

Rerouted `pendingOutbound` from `RequestsPanel` to `HistoryPanel`:

```tsx
// Before
<RequestsPanel pendingInbound={...} pendingOutbound={pendingOutbound} ... />
<HistoryPanel  sent={...}           received={...}                    ... />

// After
<RequestsPanel pendingInbound={...}                                   ... />
<HistoryPanel  sent={...}           received={...} pendingOutbound={pendingOutbound} ... />
```

---

## Full Visibility Matrix After Fix

| User role | What they see in History | What they see in Requests |
|---|---|---|
| Sender (pending) | "Sent — awaiting counterparty" section with the pending transfer | Nothing (they have no inbox items) |
| Sender (accepted) | "Sent" section with the completed transfer | Nothing |
| Receiver (pending) | Nothing yet (not their activity) | "Awaiting your decision" section — can accept/reject |
| Receiver (accepted) | "Received" section with the completed transfer | Nothing (resolved) |

---

## Why "Received" Transfers Were Also Invisible

The user's original message asked about "sent **or** received" transfers. The received side has the same structural fix — but for a different reason. For a receiver:

- While a transfer is `pending` → `visibleTransfersReceivedForPartyView` filters it out (requires `status !== "pending"`).
- After acceptance → the transfer flips to `status: "accepted"` → now visible as "Received" in History.

There is **no** pending-inbound entry in `HistoryPanel` (by design — the receiver still needs to act on it, which belongs in Requests). The receiver's workflow is:

1. See pending transfer in **Requests** → accept/reject.
2. After accepting → see completed transfer in **History → Received**.

This is intentional and correct. The only visibility gap was on the **sender side** during the pending phase, which is now fixed by showing `pendingOutbound` in History.

---

## Secondary Root Cause: `normalizeTransfers` Handles `[]` as "No Seed Data"

A latent issue exists in `lib/store.ts` that could cause history to appear blank for users with stale localStorage:

```javascript
function normalizeTransfers(transfers: Transfer[] | undefined): Transfer[] {
  return withSeedTransferAssetIds(transfers ?? SEED_TRANSFERS)
}
```

`transfers ?? SEED_TRANSFERS` uses nullish coalescing — it only falls back to `SEED_TRANSFERS` when `transfers` is `null` or `undefined`. If `transfers` is an **empty array `[]`**, it passes `[]` to `withSeedTransferAssetIds`, which maps over the empty array and returns `[]`. Seed data is **not restored**.

This means: if a user's `localStorage["hackathon-traceability"].transfers` was saved as `[]` (possible if an earlier session ran `applyCustodySnapshot({ transfers: [] })`), the store hydrates with no transfers. All party views show "No custody history yet" despite the demo having 8 seed transfers.

**Recommended fix:**

```javascript
function normalizeTransfers(transfers: Transfer[] | undefined): Transfer[] {
  if (!transfers || transfers.length === 0) {
    return withSeedTransferAssetIds(SEED_TRANSFERS)
  }
  return withSeedTransferAssetIds(transfers)
}
```

This was not applied in the current session but is tracked as a follow-up hardening task.

---

## Affected Scenarios — Before & After

| Scenario | Before fix | After fix |
|---|---|---|
| Sender with only pending outbound transfer | ❌ "No custody history yet" | ✅ "Sent — awaiting counterparty" section |
| Sender after counterparty acceptance | ✅ Shows in "Sent" | ✅ Shows in "Sent" |
| Receiver with pending inbound transfer | ✅ Shows in Requests | ✅ Shows in Requests (no change) |
| Receiver after accepting | ✅ Shows in History "Received" | ✅ Shows in History "Received" |
| Party with only seed data (fresh load) | ✅ Seed transfers show | ✅ Seed transfers show |
| Party with stale empty localStorage | ❌ No transfers shown (latent bug) | ❌ No transfers shown (tracked, not yet fixed) |
