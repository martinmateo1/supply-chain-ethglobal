---
baseline_commit: 602165419bb2ae679c6ca6c7eeb66db22afb557c
---

# Story 5.2: Demo Party Provisioning and LocalNet Bring-Up

Status: ready-for-dev

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

- [ ] Implement `daml/Scripts/SetupDemo.daml`: allocate parties for each demo Operational Node, create seed `LotPosition`s matching `lib/data.ts` seed holdings. (AC: 1)
  - [ ] Return/log allocated party IDs in a form the app config can consume (e.g. a record the gateway can read, or documented party hints).
- [ ] Confirm the demo party set and labels match the frontend Party View switcher (cross-check `lib/data.ts` / store seed). (AC: 1)
- [ ] Wire `dpm codegen-js` to emit TS bindings into `lib/ledger/generated/`; replace the empty `index.ts` placeholder and add a regen npm script. (AC: 3)
- [ ] Update `README.md` with the full local-ledger runbook: `dpm build`, `dpm sandbox`, DAR upload, run `SetupDemo`, JSON API endpoint, and party-ID surfacing. (AC: 2, 4)
- [ ] Add a `pnpm`/script entry to run the bring-up sequence end-to-end where practical. (AC: 4)

## Dev Notes

### Dependencies

- **Blocked by Story 5.1** for meaningful seed lots (needs `LotPosition`/choices), though party allocation and the runbook can start in parallel.

### Verified Toolchain Facts

- `dpm version` shows SDK `3.5.1` installed; `dpm` binary at `~/.dpm/bin/dpm` (v1.0.17).
- `dpm build` produces `.daml/dist/commodity-traceability-0.0.1.dar` (verified working).
- `dpm sandbox` = "Run full Canton installation in a single process" — use for LocalNet-style demo.
- `dpm codegen-js` = "Daml to Javascript compiler" — use for `lib/ledger/generated/`.
- `dpm script` runs Daml Script (used to execute `SetupDemo`).

### Party / Node Model

- Each wallet-like Operational Node is a Canton party (`architecture.md`). Demo route: producer → truck → silo → railway → origin port → ship → destination port. Plus at least one non-involved company to prove privacy.
- Party display names must map to the existing Party View switcher labels so the demo narration stays consistent.

### Bindings & Config

- `lib/ledger/generated/index.ts` is currently an empty placeholder. After `dpm codegen-js`, the gateway (`lib/ledger/*`, Story 5.3) imports generated contract/choice types from here.
- Party IDs from `SetupDemo` need to reach the gateway. Options: env vars (`CANTON_PARTY_*`), a generated JSON config, or a party-hint lookup. Pick one and document it (env/JSON is simplest for the demo).

### Architecture Guardrails

- LocalNet is the dev/fallback target; DevNet preferred for final judging if stable (`architecture.md` deployment decision).
- Supabase/Privy remain optional and must not hold custody truth.

### Testing Requirements

- A fresh-checkout dry run of the README steps should reach a running ledger with seeded parties/lots.
- `pnpm lint` / `pnpm typecheck` after generated bindings land (generated dir may need lint ignore — check `eslint.config.mjs`).

### References

- `_bmad-output/planning-artifacts/epics/epic-5-canton-ledger-integration.md`
- `_bmad-output/planning-artifacts/architecture.md` (party model; LocalNet/DevNet; gateway)
- `daml/Scripts/SetupDemo.daml`, `lib/data.ts`, `lib/ledger/generated/index.ts`, `README.md`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
