import { ledgerRouteError, ledgerRouteSuccess } from "@/lib/api/ledger-route"
import { isCantonBackend } from "@/lib/ledger/backend"
import { createLedgerClient } from "@/lib/ledger/client"
import { fetchLedgerTelemetry } from "@/lib/ledger/telemetry"

export async function GET() {
  if (!isCantonBackend()) {
    return ledgerRouteSuccess({ backend: "demo" as const })
  }

  try {
    const client = createLedgerClient()
    const telemetry = await fetchLedgerTelemetry(client)
    return ledgerRouteSuccess(telemetry)
  } catch (error) {
    return ledgerRouteError(error)
  }
}
