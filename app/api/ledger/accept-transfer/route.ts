import {
  acceptTransfer,
  type CustodySnapshot,
  type TransferActionRequest,
} from "@/lib/demo/custody-service"
import { ledgerRouteError, ledgerRouteSuccess } from "@/lib/api/ledger-route"

type RequestBody = TransferActionRequest & { snapshot: CustodySnapshot }

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const result = acceptTransfer(body.snapshot, {
      partyViewId: body.partyViewId,
      transferId: body.transferId,
    })

    return ledgerRouteSuccess({
      assets: result.assets,
      transfers: result.transfers,
      transfer: result.transfer,
    })
  } catch (error) {
    return ledgerRouteError(error)
  }
}
