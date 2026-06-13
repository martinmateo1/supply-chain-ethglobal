import {
  type CombineLotsRequest,
  type CustodySnapshot,
} from "@/lib/demo/custody-service"
import { ledgerRouteError, ledgerRouteSuccess } from "@/lib/api/ledger-route"
import { gatewayCombineLots } from "@/lib/ledger/gateway"

type RequestBody = CombineLotsRequest & { snapshot?: CustodySnapshot }

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const result = await gatewayCombineLots(
      body.snapshot ?? { assets: [], transfers: [] },
      {
        partyViewId: body.partyViewId,
        accountId: body.accountId,
        lotIds: body.lotIds,
      },
    )

    return ledgerRouteSuccess({
      assets: result.assets,
      transfers: result.transfers,
      asset: result.asset,
    })
  } catch (error) {
    return ledgerRouteError(error)
  }
}
