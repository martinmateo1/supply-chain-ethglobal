---
baseline_commit: 602165419bb2ae679c6ca6c7eeb66db22afb557c
---

# Story 5.2: Demo Party Provisioning and LocalNet Bring-Up

Status: review

## Story

As a developer running the demo,
I want `SetupDemo` to allocate the demo parties and seed lots on a local Canton ledger with documented commands,
so that the frontend Party Views map to real Canton parties for the judging demo.

## Acceptance Criteria

1. Given the custody route producer → truck → silo → railway → origin port → ship → destination port, when `Scripts/SetupDemo.daml` is implemented, then it allocates one Canton party per Operational Node used in the demo and creates seed `LotPosition`s aligned with the frontend seed data, and party display names map cleanly to the UI Party View switcher labels.
2. Given Canton is installed via `dpm`, when the README/setup notes are updated, then they document the exact local commands to build, start a local ledger (`dpm sandbox`), upload the DAR, and run `SetupDemo`, and they document the JSON API/ledger endpoint plus how party IDs are surfaced to the app.
3. Given the frontend needs typed ledger access, when bindings are generated, then `dpm codegen-js` output is produced into `lib/ledger/generated/` (replacing the placeholder) with a documented regeneration command, and no hand-maintained contract types drift from the compiled Daml.
4. Given a fresh machine, when a developer follows the documented steps, then they reach a running local ledger with allocated parties and seeded lots without undocumented manual steps.

## Tasks / Subtasks

- [x] Implement `daml/Scripts/SetupDemo.daml`: allocate parties for each demo Operational Node, create seed `LotPosition`s matching `lib/data.ts` seed holdings. (AC: 1)
  - [x] Return/log allocated party IDs in a form the app config can consume (debug `DEMO_PARTY` lines; party hints = operational node ids).
- [x] Confirm the demo party set and labels match the frontend Party View switcher (cross-check `lib/data.ts` / store seed). (AC: 1)
- [x] Wire `dpm codegen-js` to emit TS bindings into `lib/ledger/generated/`; replace the empty `index.ts` placeholder and add a regen npm script. (AC: 3)
- [x] Update `README.md` with the full local-ledger runbook: `dpm build`, `dpm sandbox`, DAR upload, run `SetupDemo`, JSON API endpoint, and party-ID surfacing. (AC: 2, 4)
- [x] Add a `pnpm`/script entry to run the bring-up sequence end-to-end where practical. (AC: 4)

## Dev Agent Record

### Agent Model Used

Composer

### Completion Notes List

- `SetupDemo` allocates 7 parties by hint (`production-site`, …) and seeds 3 lots per node (21 total).
- `pnpm run ledger:bringup` orchestrates build, sandbox, DAR upload, SetupDemo, and codegen.
- README documents JSON API at `http://localhost:6864` and env vars including `CANTON_PACKAGE_ID`.

### File List

- daml/Scripts/SetupDemo.daml
- lib/ledger/generated/index.ts
- scripts/generate-daml-types.ts
- scripts/ledger-bringup.sh
- README.md
- package.json
- eslint.config.mjs

### Change Log

- 2026-06-13: SetupDemo, codegen wiring, and local Canton bring-up runbook.
