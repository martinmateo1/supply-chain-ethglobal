---
baseline_commit: 3d46b3e
---

# Story 5.5: Canton Live Ledger Console Panel

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a demo operator presenting to judges,
I want an in-app terminal-style side panel that streams Canton ledger activity in real time,
so that I can prove custody actions hit the real ledger without leaving the app or opening `dpm canton-console`.

## Acceptance Criteria

1. **Given** `LEDGER_BACKEND=canton` and the sandbox is reachable, **when** the dashboard loads, **then** a fixed side panel styled like a terminal console is visible (monospace, dark background, scrollable log), **and** the panel is hidden entirely when `LEDGER_BACKEND=demo`.
2. **Given** the Canton console panel is visible, **when** the ledger is healthy, **then** it shows live telemetry polled from the gateway: ledger-end offset, active contract count (ACS), connected package id (truncated + full on hover), ledger id, and party count — matching what `docs/demo-setup.md` §7 uses to prove Canton (`ledger-end`, ACS, `CANTON_PACKAGE_ID`).
3. **Given** the user initiates, accepts, or rejects a custody transfer in the UI, **when** the gateway submits to Canton, **then** the console appends human-readable log lines for that action (choice name, template, acting party hint, offset change if available) within ~2s — without requiring a second terminal.
4. **Given** the ledger offset increases from background or UI activity, **when** polling detects `offset` > previous offset, **then** the console logs an offset tick (e.g. `offset 112 → 113`) even if the UI did not initiate the command.
5. **Given** the Canton sandbox is down or misconfigured, **when** telemetry polling fails, **then** the console shows a clear error line in the log (not a silent failure) and the main custody UI continues to work with its existing sync error handling.
6. **Given** the existing right-side workflow panels (transfer / create-lot / combine), **when** a workflow panel opens, **then** the Canton console remains usable (does not break layout, overlap primary actions, or trap focus) — prefer a dedicated narrow column or collapsible dock that coexists with workflow panels.
7. **Given** implementation is complete, **when** `pnpm lint` and `pnpm typecheck` run, **then** both pass with zero warnings; gateway telemetry has at least one focused unit test (offset parsing / event line formatting).

## Tasks / Subtasks

- [x] Add server telemetry read path (AC: 2, 4, 5)
  - [x] Extend `lib/ledger/client.ts` with helpers: `getLedgerTelemetry()` (offset, party count, package id) and `countActiveContracts()` (dedupe contract ids across demo parties or document chosen aggregation strategy).
  - [x] Add `GET /api/ledger/telemetry` (or `POST` if body needed) returning `ApiResponse<LedgerTelemetry>`; Canton-only — return 404 or `{ backend: "demo" }` stub when not in canton mode.
  - [x] Optionally add `GET /api/ledger/updates-since?offset=N` for recent transaction summaries via JSON API `/v2/updates/*` — only if needed for AC 3; otherwise derive mutation lines from gateway responses.
- [x] Build `CantonLedgerConsole` UI component (AC: 1, 6)
  - [x] New `components/canton-ledger-console.tsx`: terminal aesthetic (`font-mono`, dark panel, privacy-blue accent per `DESIGN.md`), collapsible, auto-scroll with max ~100 lines.
  - [x] Mount from `components/traceability-view.tsx` only when `isCantonBackend`; adjust layout so workflow slide panels and console coexist (e.g. console as far-right column ~280px, workflow panel left of it).
- [x] Wire live feed hook (AC: 3, 4)
  - [x] New `hooks/use-canton-ledger-console.ts`: poll `/api/ledger/telemetry` every 1–2s; detect offset deltas; expose `appendLocalEvent()` for mutation callbacks.
  - [x] From `hooks/use-custody-gateway.ts` (and `use-ledger-sync` refresh if needed), push structured events after successful Canton mutations (`InitiateTransfer`, `AcceptTransfer`, `RejectTransfer`) with choice + party hint.
- [x] Demo runbook (AC: 2)
  - [x] Update `docs/demo-setup.md` §7.3 to mention the in-app Canton console panel as the primary live-proof surface (keep `dpm canton-console` as advanced backup).
- [x] Tests & verification (AC: 7)
  - [x] Unit test telemetry mapper / log line formatter (vitest).
  - [x] Manual: `pnpm run ledger:bringup`, `pnpm dev`, initiate + accept transfer — console shows offset ticks and choice lines.

## Dev Notes

### Why this story exists

Judges currently need a **second terminal** (`dpm canton-console` or a `curl` offset loop) to believe custody runs on Canton (`docs/demo-setup.md` §7, `docs/pitch.md` §5). This story embeds that proof in the app as a guided demo affordance — aligned with UX-DR30 (guided proof surface) and the privacy-blue Canton callout language in `DESIGN.md`.

### Architecture guardrails (non-negotiable)

- **Browser never talks to Canton directly.** All telemetry goes through `app/api/ledger/*` → `lib/ledger/client.ts`, same as custody mutations. [Source: `_bmad-output/planning-artifacts/architecture.md`, Story 2.4]
- **Demo mode unchanged.** No console chrome, no extra polling, when `LEDGER_BACKEND=demo`.
- **No raw contract dumps in the main log.** Show operator-friendly lines (offset, choice, template short name, party hint). Full contract ids optional behind expand/copy — judges should not need to parse DAML JSON.
- **Privacy:** telemetry endpoint is **global ledger stats** (offset, total ACS, package id) — not a cross-party data leak. Do not stream other parties' private holdings into the console; mutation lines should only describe the **acting** party's submitted command.

### Current UI layout (must read before editing)

`TraceabilityView` (`components/traceability-view.tsx`):

- Full-height flex column; main content slides left (`-translate-x-[180px]`) when a workflow side panel opens.
- Workflow panels: 420px right `aside` for transfer / create-lot / combine.
- `AppNavbar` already shows Canton status text when `isCantonBackend` (`components/app-navbar.tsx`).

**Recommended layout approach:** Add the Canton console as a **persistent far-right column** (~260–300px) visible only in Canton mode. When a workflow panel opens, shift it left with the existing slide pattern OR keep console fixed on the viewport edge. Do not remove the navbar status — the console complements it.

### Existing ledger client capabilities to reuse

`lib/ledger/client.ts` already implements:

- `GET /v2/state/ledger-end` → `getLedgerEndOffset()`
- `POST /v2/state/active-contracts` → `queryActiveContracts(partyId, offset)`
- `GET /v2/parties` → `listParties()`
- `submitAndWaitForTransaction` returns `transaction.events` with `CreatedEvent` / `ArchivedEvent`

Package id comes from `CANTON_PACKAGE_ID` env (already required for Canton mode).

### Suggested telemetry shape

```ts
type LedgerTelemetry = {
  ledgerEndOffset: string
  activeContractCount: number
  partyCount: number
  packageId: string
  ledgerId: string
  ledgerHost: string // display only, e.g. localhost:6864
}

type CantonConsoleEvent =
  | { kind: "telemetry"; offset: string; acs: number; at: string }
  | { kind: "offset_tick"; from: string; to: string; at: string }
  | { kind: "command"; choice: string; template: string; partyHint: string; commandId?: string; at: string }
  | { kind: "error"; message: string; at: string }
```

### Suggested log line examples (judge-friendly)

```
canton://sandbox @ localhost:6864
package commodity-traceability · 48c08b5f…da096
parties: 7 · acs: 42 · offset: 113
—
12:34:01  offset 112 → 113
12:34:01  Exercise InitiateTransfer · LotPosition · production-site
12:34:08  offset 113 → 114
12:34:08  Exercise AcceptTransfer · CustodyTransfer · truck-transport
```

### Mutation event wiring

`hooks/use-custody-gateway.ts` already calls `/api/ledger/initiate-transfer`, `accept-transfer`, `reject-transfer`. After a successful Canton response:

1. Call `appendLocalEvent` on the console hook with choice name + `partyViewId` → party hint via existing `partyHintForPartyView` / `operationalNodeForPartyView`.
2. Trigger `refreshFromLedger` (already exists on `useLedgerSync`) — optional immediate telemetry poll.

Gateway routes do **not** need to change response shapes if the hook infers events from success + known action type; richer events (offset at commit) can be added to mutation responses later if cheap.

### ACS count implementation note

Canton console uses `sandbox.ledger_api.state.acs.of_all().length`. JSON API has no single "all parties" shortcut — aggregate by:

1. `listParties()` then `queryActiveContracts` per party at a **single** `ledgerEndOffset` (same pattern as `queryLedgerState` in `canton-custody-service.ts`), dedupe by `contractId`, **or**
2. Query one well-known party only and document that ACS is a lower bound (weaker demo — prefer full aggregate for 7 demo parties).

### JSON API updates (optional enhancement)

`/v2/updates/trees` exists but requires `update_format` or `filter` + `verbose`. If polling offset alone is insufficient for AC 3, add a server helper that fetches updates since `lastOffset` for a wildcard filter. Start with offset polling + local mutation events first — satisfies AC 3–4 with less risk.

### UX / visual spec

- **Colors:** Privacy blue accent (`DESIGN.md` — Canton proof callouts); dark terminal body (`bg-zinc-950` / `text-zinc-100`); success lines muted green for offset ticks.
- **Typography:** `font-mono` / Geist Mono for log lines; `text-xs`.
- **Motion:** Respect `usePrefersReducedMotion` — no flashy blink; subtle pulse on offset change only when motion allowed.
- **a11y:** `aria-label="Canton ledger activity log"`; collapsible control is keyboard reachable; log region `aria-live="polite"` for new lines.

### Files likely touched

| Path | Action |
|------|--------|
| `components/canton-ledger-console.tsx` | NEW |
| `hooks/use-canton-ledger-console.ts` | NEW |
| `components/traceability-view.tsx` | UPDATE — mount console, layout |
| `hooks/use-custody-gateway.ts` | UPDATE — emit console events on Canton success |
| `lib/ledger/client.ts` | UPDATE — telemetry helpers |
| `lib/ledger/queries.ts` or new `lib/ledger/telemetry.ts` | UPDATE/NEW — telemetry aggregation |
| `app/api/ledger/telemetry/route.ts` | NEW |
| `lib/ledger/telemetry.test.ts` or similar | NEW |
| `docs/demo-setup.md` | UPDATE §7.3 |

### Testing requirements

- `pnpm lint` — zero warnings (remove unused imports).
- `pnpm typecheck`
- `pnpm test` — add vitest for telemetry/log formatting.
- Manual Canton path: bring-up → dev → transfer → accept; verify console lines match offset watcher in `docs/demo-setup.md` §7.2.

### Previous story intelligence (5.4)

- `useLedgerSync` + `/api/ledger/visible-holdings` is the read path; reuse `isCantonBackend` from `useLedgerConfig`.
- Canton mutations read back **only the acting party** — console mutation lines must follow the same rule.
- `createLot` is stubbed on Canton path; do not promise create-lot console events until Canton create is wired.
- No Playwright E2E yet — manual demo verification is acceptable for this story.

### References

- [Source: `docs/demo-setup.md` §7 — Proving you're on Canton]
- [Source: `docs/pitch.md` §5 — Live demo script]
- [Source: `_bmad-output/planning-artifacts/epics/epic-5-canton-ledger-integration.md`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hackaton-2026-06-13/DESIGN.md` — Privacy blue, mono hashes, side-panel layout]
- [Source: `components/traceability-view.tsx` — layout integration point]
- [Source: `lib/ledger/client.ts` — JSON API v2 client]
- [Source: `_bmad-output/implementation-artifacts/5-4-authoritative-ledger-state-in-the-ui.md` — Canton sync patterns]

## Dev Agent Record

### Agent Model Used

Composer

### Completion Notes List

- Added `GET /api/ledger/telemetry` with offset, ACS (deduped across all parties), package id, ledger id/host.
- Canton console panel: far-right 280px terminal dock, collapsible, polls every 1.5s, logs offset ticks and Daml choice lines on transfer mutations.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (100 tests) pass.

### File List

- app/api/ledger/telemetry/route.ts
- components/canton-ledger-console.tsx
- components/traceability-view.tsx
- hooks/use-canton-ledger-console.ts
- hooks/use-custody-gateway.ts
- lib/canton-console-events.ts
- lib/ledger/telemetry.ts
- lib/ledger/telemetry.test.ts
- docs/demo-setup.md

### Change Log

- 2026-06-14: In-app Canton ledger console panel for live demo proof.
