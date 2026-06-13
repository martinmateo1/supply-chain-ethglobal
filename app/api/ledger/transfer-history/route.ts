import { operationalNodeForPartyView } from "@/lib/demo/party-view-auth"
import {
  type CustodySnapshot,
  transferHistoryForParty,
} from "@/lib/demo/custody-service"
import { ledgerRouteError, ledgerRouteSuccess } from "@/lib/api/ledger-route"

type RequestBody = {
  partyViewId: string
  snapshot: CustodySnapshot
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const nodeId = operationalNodeForPartyView(body.partyViewId)
    const history = transferHistoryForParty(
      body.snapshot,
      body.partyViewId,
      nodeId
    )

    return ledgerRouteSuccess(history)
  } catch (error) {
    return ledgerRouteError(error)
  }
}
