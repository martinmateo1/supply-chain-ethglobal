---
baseline_commit: 679dea508f4bf16f4e54fdb200a6de8c9245e1b5
---

# Story 1.5: Guided Demo Copy and UI Foundations

Status: done

## Story

As a demo operator,
I want the dashboard to guide judges through the privacy and custody model,
so that the app reads as a Canton proof surface rather than a generic inventory UI.

## Acceptance Criteria

1. Given the user lands on the dashboard, when the guided demo layer is visible, then it shows the route stages Origin lot, Truck, Silo, Rail, Origin port, Ship, Destination port, Attestation, and Privacy check, and the current stage or recommended next action is visually clear.
2. Given the UI refers to existing mockup concepts such as assets or accounts, when domain-facing copy is shown, then it either uses PRD glossary terms such as Lot Position, Custody Transfer, Operational Node, and Party View, or any retained mockup terms are visibly mapped to glossary meaning.
3. Given privacy callouts appear on dashboard and detail surfaces, when users read the copy, then the language explains selective visibility in operator terms, and avoids generic messages such as "permission denied" or "no data found" for privacy proof states.
4. Given commodity images are referenced by the UI, when image assets are missing or unavailable, then the UI renders resilient fallbacks instead of broken images, and commodity identity remains clear through labels, icons, or color tokens.
5. Given users navigate with keyboard or reduced-motion preferences, when they interact with dashboard controls, side panels, and upload targets, then focus order, focus visibility, and reduced-motion behavior meet the defined accessibility floor, and the desktop-first layout remains usable for the hackathon demo.

## Tasks / Subtasks

- [x] Add compact demo stepper component. (AC: 1)
  - [x] Create `components/demo-stepper.tsx` showing nine stages: Origin lot → Truck → Silo → Rail → Origin port → Ship → Destination port → Attestation → Privacy check.
  - [x] Map stages to Party View operational node ids where applicable (`production-site`, `truck-transport`, `silo`, etc.); Attestation → destination-port context; Privacy check → non-involved company.
  - [x] Highlight active step from current `selectedPartyViewId`; clicking a step switches Party View when mappable (does not mutate ledger state).
  - [x] Mount stepper in `components/traceability-view.tsx` below header or above tabs — compact, must not hide working dashboard (per DESIGN.md).
- [x] Glossary-aligned copy pass. (AC: 2)
  - [x] Audit user-facing strings in `traceability-view.tsx`, `transfer-panel.tsx`, `assets-panel.tsx`, `history-panel.tsx`, `asset-detail-view.tsx`.
  - [x] Replace or annotate "Transfer Assets" → "Transfer custody" or add subtitle mapping to Custody Transfer; "Assets" tab label may stay with tooltip/caption "Lot positions visible to this party".
  - [x] Ensure `transfer-panel.tsx` "From Account" / "To Account" map to Operational Node in labels or helper text.
- [x] Strengthen privacy copy consistency. (AC: 3)
  - [x] Review `components/privacy-callout.tsx`, privacy empty states, and asset detail blocked state — align with EXPERIENCE.md voice table (no "permission denied", no "no data found" for privacy proof).
  - [x] Confirm non-involved empty states from Story 1.2 remain intact after stepper addition.
- [x] Commodity image fallbacks. (AC: 4)
  - [x] Review `components/asset-row.tsx` and `asset-detail-view.tsx` usage of `assetImage()` / `next/image`.
  - [x] On image load error or missing path, fall back to commodity icon from `COMMODITY_META` and color token — no broken image placeholders.
- [x] Accessibility floor. (AC: 5)
  - [x] Stepper steps keyboard-focusable; active step announced to assistive tech (aria-current).
  - [x] Respect `prefers-reduced-motion`: shorten or disable dashboard slide transition in `traceability-view.tsx` (transfer/create panel translate).
  - [x] Verify side panel focus order: close → title → fields → summary → confirm (matches EXPERIENCE.md).
  - [x] Party switcher already exposes role and total via visible text; confirm sr-only node labels remain.

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `pnpm typecheck` — pass
- `pnpm lint` — pass

### Completion Notes List

- Added `DemoStepper` with nine custody-route stages; clicking switches Party View without mutating ledger state.
- Glossary copy: Lot positions / Custody history tabs, Transfer custody panel, operational node labels.
- `CommodityThumbnail` component with icon fallback on image load error.
- `usePrefersReducedMotion` hook disables panel slide animations when OS prefers reduced motion.

### File List

- `components/demo-stepper.tsx`
- `components/commodity-thumbnail.tsx`
- `components/traceability-view.tsx`
- `components/transfer-panel.tsx`
- `components/asset-row.tsx`
- `components/transfer-row.tsx`
- `components/asset-detail-view.tsx`
- `hooks/use-prefers-reduced-motion.ts`

### Change Log

- 2026-06-13: Story 1.5 — Demo stepper, glossary copy pass, commodity image fallbacks, reduced-motion support.
