import { ledgerRouteSuccess } from "@/lib/api/ledger-route"
import { resolveLedgerBackend } from "@/lib/ledger/backend"

export async function GET() {
  return ledgerRouteSuccess({ backend: resolveLedgerBackend() })
}
