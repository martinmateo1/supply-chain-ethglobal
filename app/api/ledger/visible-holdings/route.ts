import { ledgerRouteError, ledgerRouteSuccess } from "@/lib/api/ledger-route"
import { gatewayVisibleHoldings } from "@/lib/ledger/gateway"

type RequestBody = {
  partyViewId: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const snapshot = await gatewayVisibleHoldings(body.partyViewId)

    if (!snapshot) {
      return ledgerRouteError(
        new Error("Visible holdings are only available when LEDGER_BACKEND=canton."),
      )
    }

    return ledgerRouteSuccess(snapshot)
  } catch (error) {
    return ledgerRouteError(error)
  }
}
