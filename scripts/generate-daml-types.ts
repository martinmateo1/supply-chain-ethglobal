#!/usr/bin/env node
/**
 * Regenerates TypeScript bindings from compiled Daml packages into lib/ledger/generated/.
 *
 * Prerequisites:
 *   - Daml SDK installed (https://docs.daml.com/getting-started/installation.html)
 *   - daml build succeeds in ./daml
 *
 * TODO: Wire to the project's chosen codegen path (daml codegen js or Canton TS bindings)
 * once the ledger runtime is selected for LocalNet/DevNet.
 */
console.log(
  [
    "generate-daml-types: not yet wired.",
    "Run `cd daml && daml build` after installing the Daml SDK.",
    "Then update this script with the chosen codegen command for lib/ledger/generated/.",
  ].join(" "),
)
