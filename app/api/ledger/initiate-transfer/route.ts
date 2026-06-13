import {
  type CustodySnapshot,
  initiateTransfer,
} from "@/lib/demo/custody-service"
import type { InitiateTransferRequest } from "@/lib/demo/custody-service"
import { ledgerRouteError, ledgerRouteSuccess } from "@/lib/api/ledger-route"

type RequestBody = InitiateTransferRequest & { snapshot: CustodySnapshot }

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const result = initiateTransfer(body.snapshot, {
      partyViewId: body.partyViewId,
      fromAccountId: body.fromAccountId,
      toAccountId: body.toAccountId,
      assetId: body.assetId,
      quantity: body.quantity,
      attachments: body.attachments,
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
