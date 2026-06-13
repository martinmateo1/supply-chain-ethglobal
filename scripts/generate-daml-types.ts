#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const dar = resolve(root, ".daml/dist/commodity-traceability-0.0.1.dar")
const output = resolve(root, "lib/ledger/generated")
const dpm = `${process.env.HOME}/.dpm/bin/dpm`

if (!existsSync(dar)) {
  console.error("DAR not found. Run `dpm build` first.")
  process.exit(1)
}

const result = spawnSync(dpm, ["codegen-js", dar, "-o", output], {
  stdio: "inherit",
  cwd: root,
})

process.exit(result.status ?? 1)
