import type { CustodySnapshot } from "@/lib/demo/custody-service"
import { ledgerRouteError, ledgerRouteSuccess } from "@/lib/api/ledger-route"
import { gatewayTransferHistory } from "@/lib/ledger/gateway"

type RequestBody = {
  partyViewId: string
  snapshot?: CustodySnapshot
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const history = await gatewayTransferHistory(
      body.snapshot ?? { assets: [], transfers: [] },
      body.partyViewId,
    )

    return ledgerRouteSuccess(history)
  } catch (error) {
    return ledgerRouteError(error)
  }
}
