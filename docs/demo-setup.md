# Demo Setup — Private Commodity Traceability

How to run the full demo locally, including the optional Canton ledger-backed path.

> Keep this document current. When setup steps, env vars, ports, scripts, or package
> versions change, update this file in the same change (see `.cursor/rules/demo-setup-doc.mdc`).

---

## 1. Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Next.js app and TypeScript tooling |
| pnpm | 9+ | Package manager |
| dpm | 1.x (`~/.dpm/bin/dpm`) | Daml SDK 3.5.1 — build, sandbox, codegen |
| Java | 17 (Temurin recommended) | Daml Script / Canton sandbox runtime |

Verify tooling:

```bash
node -v
pnpm -v
~/.dpm/bin/dpm version          # expect SDK 3.5.1
/usr/libexec/java_home -v 17    # macOS: confirm Temurin 17 is installed
```

`JAVA_HOME` must point at Java 17 for Daml Script / sandbox. The ledger scripts default to:

```
/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

Override by exporting `JAVA_HOME` before running.

---

## 2. Two backends

The app runs in one of two modes, selected by `LEDGER_BACKEND`:

| Mode | When | Source of truth |
|---|---|---|
| `demo` (default) | No ledger needed; offline UI demo | Client snapshot validated by the gateway |
| `canton` | Ledger-backed demo | Canton/Daml ledger; UI reads holdings from the gateway |

---

## 3. Demo mode (no ledger)

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

`LEDGER_BACKEND` defaults to `demo`, so no `.env.local` is required. Custody state is seeded
from `lib/data.ts` and persisted in the browser for the offline demo.

Quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm test                      # vitest: gateway mappers + Canton error mapping
pnpm verify:custody-transfers
pnpm verify:party-visibility
```

---

## 4. Canton ledger-backed mode

### 4.1 One-shot bring-up

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
pnpm run ledger:bringup
```

`ledger:bringup` is idempotent. It:

1. Builds the DAR (`dpm build`).
2. Starts `dpm sandbox` if not already running (gRPC `:6865`, JSON API `:6864`).
3. Fresh ledger → uploads the DAR and runs `SetupDemo` (allocates 7 parties, seeds 21 lots).
   - Already provisioned with the current DAR → skips upload and seeding.
   - Parties exist but DAR hash changed → reuses the on-ledger package (Canton refuses to
     re-upload the same name/version). For a clean re-seed, stop the sandbox and re-run.
4. Generates TypeScript bindings into `lib/ledger/generated/`.
5. Prints the env vars to copy into `.env.local`.

### 4.2 Configure `.env.local`

Copy the values printed by `ledger:bringup`:

```env
LEDGER_BACKEND=canton
CANTON_LEDGER_HOST=http://localhost:6864
CANTON_LEDGER_ID=sandbox
CANTON_PACKAGE_ID=<64-hex package id from the bring-up output>
```

`CANTON_PACKAGE_ID` is the `commodity-traceability` package hash. It changes whenever the
Daml model changes; re-run `ledger:bringup` and update `.env.local` after any `.daml` edit.

### 4.3 Run the app

Env vars in `.env.local` are read at server startup only. If a dev server is already running,
restart it so it picks up the Canton config:

```bash
# if a dev server is already on :3000
kill <PID>     # PID is printed by Next.js, or: lsof -ti:3000 | xargs kill
pnpm dev
```

Open http://localhost:3000. Holdings and pending transfers are now read from the Canton ledger.

### 4.4 Verify the Canton path

These scripts auto-load `.env.local` (via `tsx --env-file-if-exists=.env.local`), so no inline
env vars are needed once `.env.local` is set:

```bash
pnpm ledger:verify-demo-flow        # happy path: initiate -> accept (asserts receiver lot)
pnpm ledger:attempt-double-spend    # negative: double-spend blocked (asserts consumed-lot failure)
```

> **Note on Create Lot:** under `LEDGER_BACKEND=canton` the in-app "Create Lot" panel is hidden —
> `createLot` is not yet ledger-backed, so origin lots come from `SetupDemo` seeding. Drive the
> demo via the transfer → accept/reject flow. To override without `.env.local`, pass env vars inline:

```bash
LEDGER_BACKEND=canton \
CANTON_LEDGER_HOST=http://localhost:6864 \
CANTON_LEDGER_ID=sandbox \
CANTON_PACKAGE_ID=<package-id> \
pnpm ledger:verify-demo-flow
```

---

## 5. Manual ledger commands (equivalent to bring-up)

```bash
dpm build
dpm test                            # runs Daml Script tests in daml/Test/
dpm sandbox                         # gRPC :6865, JSON API :6864

dpm script \
  --dar .daml/dist/commodity-traceability-0.0.1.dar \
  --script-name Scripts.SetupDemo:setupDemo \
  --ledger-host localhost \
  --ledger-port 6865 \
  --upload-dar true

pnpm run generate:daml-types        # regenerate lib/ledger/generated/

# package id for CANTON_PACKAGE_ID:
dpm inspect-dar .daml/dist/commodity-traceability-0.0.1.dar
```

Party hints match operational node ids: `production-site`, `truck-transport`, `silo`,
`railway-transport`, `origin-port`, `ship`, `destination-port`.

---

## 6. Ports and endpoints

| Port | Service |
|---|---|
| 3000 | Next.js app |
| 6864 | Canton JSON Ledger API (v2) — used by `lib/ledger/client.ts` |
| 6865 | Canton gRPC Ledger API — used by `dpm script` |

JSON API quick checks:

```bash
curl -s http://localhost:6864/v2/state/ledger-end
curl -s http://localhost:6864/v2/parties
```

---

## 7. Proving you're on Canton (live demo)

The app is a layer on top of the Canton JSON API — it is not Canton itself. To show judges
that custody really runs on a Canton ledger, use the Canton console and the JSON API side by
side with the UI. There is no web dashboard (Navigator) in this `dpm sandbox` setup.

### 7.1 Canton console

The sandbox must already be running (`pnpm run ledger:bringup`). In a **second terminal**:

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
dpm canton-console
```

`dpm canton-console` is a **client only** — it does not start the ledger. If it reports
`Connection refused: /127.0.0.1:6866`, the sandbox is not running; start it first.

Strongest one-liners (note: `status` and `is_running` are properties — no `()`):

```scala
sandbox.health.status        // node alive + connected synchronizer + version
sandbox.health.is_running    // true
sandbox.dars.list()          // commodity-traceability is uploaded on-ledger
sandbox.parties.list()       // the 7 demo parties from SetupDemo
```

The convincing detail: the `mainPackageId` printed by `sandbox.dars.list()` for
`commodity-traceability` **matches `CANTON_PACKAGE_ID` in `.env.local`**. The app points at
that exact on-ledger package.

Discover more in the REPL with `help()`, `help("sandbox.health")`, or `help("sandbox.dars")`.

### 7.2 Live contract / offset count

Show the ledger move when you click in the UI. Run before and after a transfer:

```scala
sandbox.ledger_api.state.acs.of_all().length   // active contract count
```

Or watch the ledger end offset from the shell (macOS has no `watch` by default):

```bash
while true; do curl -s http://localhost:6864/v2/state/ledger-end; echo; sleep 1; done
```

Demo beat: note the offset → initiate a transfer in the UI → offset increments → accept →
it increments again. Each custody action is a Daml choice executed on Canton.

### 7.3 In-app proof

With `LEDGER_BACKEND=canton`, the UI itself surfaces Canton behavior:

- The banner "Holdings and pending transfers are read from the Canton ledger."
- Selective visibility: pick an unrelated Party View → empty holdings with the Canton privacy
  note (not a loading error); switch to a route party → records appear.

### 7.4 Scripted proof (backup / Q&A)

```bash
pnpm ledger:verify-demo-flow        # happy path: initiate -> accept
pnpm ledger:attempt-double-spend    # Daml rejects the second spend
```

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Party already exists: production-site::...` | Sandbox already seeded | Expected; `ledger:bringup` now skips re-seeding. For a clean reset, stop the sandbox and re-run. |
| `Tried to vet two packages with the same name and version` | DAR hash changed but a prior version is uploaded | Stop the sandbox for a clean ledger, or reuse the on-ledger package (bring-up handles this). |
| `Another next dev server is already running` | A dev server is already on :3000 | `kill <PID>` then `pnpm dev`; env changes need a restart. |
| `LEDGER_NOT_CONFIGURED` running a `ledger:*` script | `.env.local` missing or not loaded | Ensure `.env.local` exists (the scripts auto-load it); or pass `CANTON_*` env vars inline. |
| `Script service exited unexpectedly` / heap errors | `JAVA_HOME` not Java 17 | `export JAVA_HOME=.../temurin-17.jdk/Contents/Home`. |
| `PACKAGE_SERVICE_CANNOT_AUTODETECT_SYNCHRONIZER` on bring-up | Sandbox JSON API up before synchronizer connected | Re-run `pnpm run ledger:bringup` (the script retries automatically). If it persists, stop the sandbox (`lsof -ti:6864 \| xargs kill`) and bring up again. |

---

## 9. Key files

| Path | Role |
|---|---|
| `daml/Commodity/LotPosition.daml` | Custody templates + choices (source of truth) |
| `daml/Scripts/SetupDemo.daml` | Party allocation + seed lots |
| `daml/Test/TraceabilityTest.daml` | Daml Script tests (happy path, double-spend, reject) |
| `lib/ledger/gateway.ts` | `LEDGER_BACKEND` dispatch (demo vs canton) |
| `lib/ledger/client.ts` | Canton JSON API v2 client |
| `lib/ledger/generated/` | `dpm codegen-js` output (do not hand-edit) |
| `app/api/ledger/*` | Gateway routes consumed by the UI |
| `scripts/ledger-bringup.sh` | Idempotent local ledger bring-up |
| `.env.local` | Backend selection + Canton connection config |
