#!/usr/bin/env node
/**
 * End-to-end demo verification script (stub).
 *
 * Will orchestrate:
 *   - Canton LocalNet/DevNet health check
 *   - scripts/seed-demo-ledger.ts (future)
 *   - UI-visible custody path smoke checks
 *   - scripts/attempt-double-spend.ts negative path
 *
 * Not runnable until ledger gateway and demo seeding exist.
 */
console.log(
  [
    "verify-demo-flow: NOT IMPLEMENTED.",
    "Prerequisites: Canton LocalNet/DevNet, daml build, ledger API routes.",
    "Use `pnpm dev` for UI-only demo until this script is completed.",
  ].join("\n"),
)

process.exit(0)
