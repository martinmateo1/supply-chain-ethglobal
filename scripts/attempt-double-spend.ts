#!/usr/bin/env node
/**
 * Negative anti-double-spend proof script (stub).
 *
 * Intended behavior (Epic 3.4 / Epic 4):
 *   1. Seed or load a SourceAssetReference with a certified quantity.
 *   2. Spend the quantity in a valid custody transfer.
 *   3. Attempt to spend the same source quantity again.
 *   4. Expect failure with SOURCE_ASSET_ALREADY_CONSUMED (or Daml contract abort).
 *
 * This script does NOT prove the invariant yet — it documents the path explicitly.
 */
import { LedgerErrorCode } from "../lib/ledger/errors.js"

const EXPECTED_FAILURE_CODE = LedgerErrorCode.SOURCE_ASSET_ALREADY_CONSUMED

console.log(
  [
    "attempt-double-spend: NOT IMPLEMENTED.",
    `Tracked expected failure code: ${EXPECTED_FAILURE_CODE}.`,
    "Complete Daml SourceAssetReference consumption choices and ledger gateway first.",
    "See daml/Test/TraceabilityTest.daml for the on-ledger negative test placeholder.",
  ].join("\n"),
)

process.exit(0)
