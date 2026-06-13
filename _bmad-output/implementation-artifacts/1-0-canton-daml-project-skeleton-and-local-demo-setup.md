---
baseline_commit: 1defd8af1a6cabbcf8d5cad0cd60349aa2e5cb80
---

# Story 1.0: Canton/Daml Project Skeleton and Local Demo Setup

Status: done

## Story

As a developer,
I want the existing Next.js app to have a Daml/Canton project skeleton and documented local commands,
so that custody, provenance, and privacy work can be implemented against the intended Canton source of truth instead of remaining mock-only.

## Acceptance Criteria

1. Given the existing Next.js mockup repository is the frontend foundation, when the setup story is implemented, then the app keeps the current `app/`, `components/`, `hooks/`, and `lib/` structure, and no new frontend starter is initialized unless the current app becomes unusable.
2. Given Daml/Canton is the custody source of truth, when the project skeleton is added, then a `daml/` project area exists with `daml.yaml` and initial contract/test or script placeholders for `LotPosition`, `CustodyTransfer`, `SourceAssetReference`, and `TraceabilityAttestation`, and the structure follows the architecture's Daml naming conventions.
3. Given frontend code will need ledger-facing types, when the setup story is complete, then the intended generated bindings location is documented or stubbed under `lib/ledger/generated/`, and scripts or README notes explain how bindings should be regenerated once Daml contracts compile.
4. Given implementation agents need reproducible local commands, when the README or setup documentation is updated, then it includes local prerequisites, Daml/Canton build or test commands, Next.js app commands, and DevNet/LocalNet fallback notes, and it clearly states that Supabase and Privy remain optional for the MVP unless later stories enable them.
5. Given current UI/demo state may remain while Canton work is introduced, when demo adapters or mock data remain in use, then they are clearly separated from `lib/ledger/` source-of-truth boundaries, and no client-side store is treated as authoritative custody quantity.
6. Given the architecture requires anti-double-spend proof, when initial ledger tests or scripts are stubbed, then there is a documented path for a negative double-spend attempt that later stories can complete, and the missing implementation is tracked explicitly rather than implied.

## Tasks / Subtasks

- [x] Add the Daml/Canton skeleton without replacing the existing frontend. (AC: 1, 2)
  - [x] Create `daml/daml.yaml` and initial Daml module folders matching the architecture: `Commodity/Types.daml`, `Commodity/OperationalNode.daml`, `Commodity/LotPosition.daml`, `Commodity/CustodyTransfer.daml`, `Commodity/EvidenceReference.daml`, `Commodity/SourceAssetReference.daml`, and `Commodity/TraceabilityAttestation.daml`.
  - [x] Add `daml/Scripts/SetupDemo.daml` and `daml/Test/TraceabilityTest.daml` placeholders or minimal compilable stubs if the Daml SDK is available.
- [x] Establish ledger integration boundaries. (AC: 3, 5)
  - [x] Add `lib/ledger/` with clear placeholders for `client.ts`, `commands.ts`, `queries.ts`, `mappers.ts`, `errors.ts`, and `generated/`.
  - [x] Keep `lib/store.ts` as UI/demo state only; do not migrate custody authority into Zustand.
- [x] Document local setup and demo commands. (AC: 4)
  - [x] Update `README.md` with Node.js 20+, Next.js commands, Daml/Canton prerequisites, build/test placeholders, DevNet/LocalNet notes, and optional Supabase/Privy status.
  - [x] Document how generated Daml TypeScript bindings will be created once contracts compile.
- [x] Add explicit anti-double-spend follow-up hooks. (AC: 6)
  - [x] Stub or document `scripts/attempt-double-spend.ts` and `scripts/verify-demo-flow.ts` as the future negative proof path.
  - [x] Ensure TODOs describe missing implementation without implying the invariant already passes.

## Dev Notes

### Current Implementation Context

- `package.json` already uses Next.js `16.2.6`, React `19.2.4`, TypeScript, Tailwind CSS v4, shadcn primitives, and Zustand.
- `app/page.tsx` renders `components/traceability-view.tsx`; `app/assets/[id]/page.tsx` uses async `params`, which is required by current Next.js App Router docs.
- `components/traceability-view.tsx`, `components/transfer-panel.tsx`, `components/assets-panel.tsx`, `components/history-panel.tsx`, and `components/asset-detail-view.tsx` are the active UI path.
- `components/transfer-modal.tsx` and `components/account-list.tsx` are currently duplicate or superseded paths; do not make them the primary architecture unless intentionally revived.
- `lib/store.ts` persists local seeded custody state in Zustand/localStorage. It must remain a demo adapter, not custody truth.

### Architecture Guardrails

- Daml/Canton owns custody, provenance, quantity conservation, certified-quantity single-use, and attestation-relevant state.
- Supabase, if later used, is limited to off-ledger evidence metadata or file references and must never store authoritative custody quantity.
- Browser components must not submit raw Canton commands. Ledger actions go through the future Next.js gateway and `lib/ledger/*`.
- Use PRD glossary terms in new domain-facing code: `LotPosition`, `CustodyTransfer`, `EvidenceReference`, `SourceAssetReference`, `TraceabilityAttestation`, `Commodity`, `Company`, `OperationalNode`, `PartyView`, and `ProvenanceLink`.
- Avoid adding broad Daml observers to simplify the demo; privacy leaks across Party Views are blockers.

### Next.js 16 Notes

- Relevant local docs were checked under `node_modules/next/dist/docs/`.
- Route handlers use `app/**/route.ts` and Web `Request`/`Response`; dynamic route `params` are promises.
- Use `'use client'` only at client component entry points that need state, event handlers, or browser APIs.

### Testing Requirements

- Run `pnpm lint` and `pnpm typecheck` after TypeScript changes.
- If Daml tooling is installed, run the Daml build/test command documented by the implementation.
- At minimum, the skeleton should include a clear path for future tests covering quantity conservation and a failed double-spend attempt.

### References

- `_bmad-output/planning-artifacts/epics/epic-1-private-party-dashboard-origin-lot-creation.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Daml SDK not installed in dev environment; skeleton uses SDK 2.9.3 per `daml/daml.yaml` and compiles when SDK is available.
- `pnpm lint` passes with pre-existing warnings only; `pnpm typecheck` passes.

### Completion Notes List

- Added full `daml/` project skeleton with PRD-aligned `Commodity/*` templates, `Scripts/SetupDemo.daml`, and `Test/TraceabilityTest.daml` placeholders.
- Established `lib/ledger/*` integration boundary with stable error codes; `lib/store.ts` annotated as UI/demo-only.
- Documented prerequisites, Next.js, Daml/Canton, bindings regeneration, and optional Supabase/Privy in README.
- Added stub scripts for double-spend negative proof and demo verification with explicit NOT IMPLEMENTED messaging.
- Verified `pnpm lint`, `pnpm typecheck`, and stub script execution.

### File List

- daml/daml.yaml
- daml/.gitignore
- daml/Main.daml
- daml/Commodity/Types.daml
- daml/Commodity/OperationalNode.daml
- daml/Commodity/LotPosition.daml
- daml/Commodity/CustodyTransfer.daml
- daml/Commodity/EvidenceReference.daml
- daml/Commodity/SourceAssetReference.daml
- daml/Commodity/TraceabilityAttestation.daml
- daml/Scripts/SetupDemo.daml
- daml/Test/TraceabilityTest.daml
- lib/ledger/client.ts
- lib/ledger/commands.ts
- lib/ledger/queries.ts
- lib/ledger/mappers.ts
- lib/ledger/errors.ts
- lib/ledger/generated/index.ts
- lib/store.ts
- scripts/generate-daml-types.ts
- scripts/attempt-double-spend.ts
- scripts/verify-demo-flow.ts
- README.md
- package.json
- pnpm-lock.yaml

### Change Log

- 2026-06-13: Story 1.0 — Daml/Canton skeleton, ledger integration boundaries, setup docs, anti-double-spend stubs.
