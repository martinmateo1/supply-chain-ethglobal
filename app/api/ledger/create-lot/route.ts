import {
  type CreateLotRequest,
  type CustodySnapshot,
} from "@/lib/demo/custody-service"
import { ledgerRouteError, ledgerRouteSuccess } from "@/lib/api/ledger-route"
import { gatewayCreateLot } from "@/lib/ledger/gateway"

type RequestBody = CreateLotRequest & { snapshot?: CustodySnapshot }

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const result = await gatewayCreateLot(
      body.snapshot ?? { assets: [], transfers: [] },
      {
        partyViewId: body.partyViewId,
        accountId: body.accountId,
        commodity: body.commodity,
        quantity: body.quantity,
        rating: body.rating,
        certifications: body.certifications,
        originIdentifier: body.originIdentifier,
        attachments: body.attachments,
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
