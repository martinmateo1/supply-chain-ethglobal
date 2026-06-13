#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JAVA_HOME="${JAVA_HOME:-/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home}"
DPM="${DPM:-$HOME/.dpm/bin/dpm}"
JSON_API="${CANTON_LEDGER_HOST:-http://localhost:6864}"
DAR=".daml/dist/commodity-traceability-0.0.1.dar"

demo_parties_exist() {
  curl -sf "${JSON_API}/v2/parties" 2>/dev/null | grep -q '"party":"production-site::'
}

package_id_from_dar() {
  "$DPM" inspect-dar "$DAR" 2>/dev/null \
    | sed -n 's|^commodity-traceability-0.0.1-\([0-9a-f]\{64\}\)/.*|\1|p' \
    | head -1
}

ledger_has_package() {
  local pkg="$1"
  curl -sf "${JSON_API}/v2/packages" 2>/dev/null | grep -q "$pkg"
}

production_site_party() {
  curl -sf "${JSON_API}/v2/parties" 2>/dev/null \
    | python3 -c 'import json,sys
data=json.load(sys.stdin)
for p in data.get("partyDetails",[]):
  party=p.get("party","")
  if party.startswith("production-site::"):
    print(party); break'
}

package_id_on_ledger() {
  local party="$1"
  local offset
  offset="$(curl -sf "${JSON_API}/v2/state/ledger-end" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("offset","0"))')"
  curl -sf -X POST "${JSON_API}/v2/state/active-contracts" \
    -H 'Content-Type: application/json' \
    -d "{\"filter\":{\"filtersByParty\":{\"${party}\":{\"cumulative\":[{\"identifierFilter\":{\"WildcardFilter\":{\"value\":{\"includeCreatedEventBlob\":false}}}}]}}},\"verbose\":false,\"activeAtOffset\":\"${offset}\"}" \
    | python3 -c 'import json,sys
rows=json.load(sys.stdin)
for row in rows:
  pkg=row.get("contractEntry",{}).get("JsActiveContract",{}).get("createdEvent",{}).get("representativePackageId")
  if pkg:
    print(pkg); break'
}

SANDBOX_LOG="/tmp/hackaton-canton-sandbox.log"

wait_for_json_api() {
  for _ in $(seq 1 60); do
    if curl -sf "${JSON_API}/v2/state/ledger-end" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

wait_for_sandbox_ready() {
  for _ in $(seq 1 60); do
    if grep -q "Canton sandbox is ready." "${SANDBOX_LOG}" 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

run_setup_demo() {
  local attempt output
  for attempt in $(seq 1 20); do
    if output="$("$DPM" script \
      --dar "$DAR" \
      --script-name Scripts.SetupDemo:setupDemo \
      --ledger-host localhost \
      --ledger-port 6865 \
      --upload-dar true 2>&1)"; then
      printf '%s\n' "$output"
      return 0
    fi

    if printf '%s\n' "$output" | grep -q "PACKAGE_SERVICE_CANNOT_AUTODETECT_SYNCHRONIZER"; then
      echo "    Canton synchronizer not ready yet (attempt ${attempt}/20); retrying..."
      sleep 2
      continue
    fi

    printf '%s\n' "$output" >&2
    return 1
  done

  echo "SetupDemo failed: Canton synchronizer did not become ready in time." >&2
  return 1
}

echo "==> Building Daml package"
"$DPM" build

echo "==> Starting Canton sandbox (if not already running)"
if ! curl -sf "${JSON_API}/v2/state/ledger-end" >/dev/null 2>&1; then
  : >"${SANDBOX_LOG}"
  "$DPM" sandbox >"${SANDBOX_LOG}" 2>&1 &
  if ! wait_for_json_api; then
    echo "Canton sandbox JSON API did not become ready on ${JSON_API}" >&2
    exit 1
  fi
  if ! wait_for_sandbox_ready; then
    echo "Canton sandbox did not report ready in ${SANDBOX_LOG}" >&2
    exit 1
  fi
  # JSON API can respond before the synchronizer accepts package uploads.
  sleep 2
fi

if ! curl -sf "${JSON_API}/v2/state/ledger-end" >/dev/null 2>&1; then
  echo "Canton sandbox did not become ready on ${JSON_API}" >&2
  exit 1
fi

LOCAL_PACKAGE_ID="$(package_id_from_dar)"
if [[ -z "$LOCAL_PACKAGE_ID" ]]; then
  echo "Could not determine package id from ${DAR}" >&2
  exit 1
fi

if demo_parties_exist; then
  if ledger_has_package "$LOCAL_PACKAGE_ID"; then
    echo "==> Demo ledger already provisioned with current DAR; skipping upload and SetupDemo"
    PACKAGE_ID="$LOCAL_PACKAGE_ID"
  else
    echo "==> Demo parties exist but DAR package hash changed."
    echo "    Uploading the same name/version again is not supported on Canton."
    PARTY="$(production_site_party || true)"
    PACKAGE_ID="$(package_id_on_ledger "$PARTY" || true)"
    if [[ -z "$PACKAGE_ID" ]]; then
      PACKAGE_ID="$LOCAL_PACKAGE_ID"
    fi
    echo "    Using package already on ledger: ${PACKAGE_ID}"
    echo "    For a clean re-seed, stop the sandbox and run this script again."
  fi
else
  echo "==> Uploading DAR and running SetupDemo"
  run_setup_demo
  PACKAGE_ID="$LOCAL_PACKAGE_ID"
fi

echo "==> Generating TypeScript bindings"
pnpm run generate:daml-types

cat <<EOF

Local Canton ledger is ready.

Set these environment variables for the Next.js app:

  LEDGER_BACKEND=canton
  CANTON_LEDGER_HOST=${JSON_API}
  CANTON_LEDGER_ID=sandbox
  CANTON_PACKAGE_ID=${PACKAGE_ID}

Party hints match operational node ids (production-site, truck-transport, ...).
EOF
