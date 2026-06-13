# Story 1.1: Party View Shell and Privacy-Aware Dashboard

Status: ready-for-dev

## Story

As a demo operator,
I want to switch between preconfigured company Party Views in the existing dashboard,
so that I can show that each company sees only its own relevant commodity holdings and custody activity.

## Acceptance Criteria

1. Given the dashboard is open at `/`, when the user views the active Party View selector, then the selector displays the active company role, operational node name, and visible total quantity, and the selected Party View remains visible while dashboard panels are open.
2. Given multiple preconfigured Party Views exist for the custody route, when the user switches Party View, then the dashboard updates visible holdings and transfer history for the selected party, and the UI does not expose holdings or transfers unrelated to that party.
3. Given the deterministic demo fixture includes an origin producer, sender, receiver, current custodian, prior custodian, verifier, and non-involved company, when the fixture is loaded, then each Party View has an expected visibility matrix for holdings, transfers, evidence, and attestations, and the dashboard behavior can be verified against that matrix.
4. Given the active party has visible Lot Positions, when the user opens the Assets tab, then the holdings list shows commodity, quantity, unit, quality grade, certification labels, and detail navigation for each visible Lot Position, and the UI uses glossary-aligned copy or clearly maps existing "asset" language to Lot Position meaning.
5. Given the active party has visible custody activity, when the user opens the History tab, then the dashboard shows sent and received Custody Transfers visible to that Party View, and each row identifies counterparty, commodity, quantity, date, certification labels, and evidence count when available.
6. Given the active Party View changes, when the dashboard rerenders, then the active Party View, holdings, transfer history, and privacy explanation are consistent with the selected party, and no client-side cached state leaks a previous party's private records.
7. Given the app is used in a short judge demo, when the user lands on the dashboard, then the screen clearly communicates that visibility is party-based Canton selective visibility, and the dashboard remains desktop-first, consistent with the existing Next.js/shadcn UI shell.

## Tasks / Subtasks

- [ ] Replace account-centric wording with Party View language where it is user-facing. (AC: 1, 4, 7)
  - [ ] Update `components/traceability-view.tsx` selector copy to include company role, operational node, and visible total.
  - [ ] Preserve the fixed selector behavior while side panels are open.
- [ ] Add deterministic Party View metadata and visibility matrix. (AC: 2, 3, 6)
  - [ ] Extend or split `lib/data.ts` into `lib/demo/companies.ts`, `lib/demo/operational-nodes.ts`, and `lib/demo/party-views.ts` if useful.
  - [ ] Add a non-involved company fixture even if Story 1.2 handles the strong empty state.
- [ ] Make holdings and history Party View-aware. (AC: 2, 4, 5, 6)
  - [ ] Review `lib/provenance.ts` and `lib/store.ts`; fix any logic that shows records because of commodity/certification matching without explicit party entitlement.
  - [ ] Keep Zustand state limited to selected Party View and demo data until the ledger gateway replaces it.
- [ ] Add dashboard privacy explanation. (AC: 7)
  - [ ] Add a compact callout explaining that Canton visibility is party-based, not a missing-data state.

## Dev Notes

### Current Implementation Context

- `components/traceability-view.tsx` already has the main dashboard shell, Assets/History tabs, a sliding transfer panel, and a fixed lower-left selector.
- Current types use `Account` and `Asset` in `lib/types.ts`; architecture wants new domain-facing work to use or map to `PartyView`, `OperationalNode`, `LotPosition`, and `CustodyTransfer`.
- `lib/data.ts` currently seeds seven operational nodes: production site, truck, silo, rail, origin port, ship, and destination port. It does not yet include a non-involved company.
- `lib/store.ts` exposes `assetsByAccount`, `transfersSentByAccount`, and `transfersReceivedByAccount`; these are local demo selectors, not ledger queries.
- `lib/provenance.ts` grants visibility to the holding account or transfer participants. Validate this against a formal visibility matrix before relying on it.

### Architecture Guardrails

- Every privacy-relevant selector must preserve selective visibility. Do not add all companies as observers or client-side filters that pretend to be Canton privacy.
- Browser state can hold active Party View, filters, and selected records only. Ledger-derived data must eventually come through `app/api/ledger/visible-holdings` and `app/api/ledger/transfer-history`.
- If existing "asset" copy remains, explicitly map it to Lot Position in UI copy or comments.

### Previous Story Dependency

- Story 1.0 should establish the Daml/Canton skeleton and README boundaries. If it has not been implemented yet, this story may remain demo-state-backed but must not contradict the future ledger gateway.

### Testing Requirements

- Add focused tests or scripted checks for the visibility matrix if a test harness is present.
- Manually verify Party View switching changes holdings, history, totals, and callouts without stale previous-party data.
- Run `pnpm lint` and `pnpm typecheck`.

### References

- `_bmad-output/planning-artifacts/epics/epic-1-private-party-dashboard-origin-lot-creation.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hackaton-2026-06-13/EXPERIENCE.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hackaton-2026-06-13/DESIGN.md`

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

### Completion Notes List

### File List
