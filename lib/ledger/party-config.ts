import { operationalNodeForPartyView } from "@/lib/demo/party-view-auth"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"
import type { LedgerClient } from "@/lib/ledger/client"

/** Operational node id doubles as the Canton party hint in SetupDemo. */
export function partyHintForPartyView(partyViewId: string): string {
  const nodeId = operationalNodeForPartyView(partyViewId)
  if (!nodeId) {
    throw new LedgerError(
      LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
      "This Party View is not mapped to a Canton operational node.",
    )
  }
  return nodeId
}

export async function resolvePartyId(
  client: LedgerClient,
  partyHint: string,
): Promise<string> {
  const party = await client.findPartyByHint(partyHint)
  if (!party) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      `Canton party for operational node "${partyHint}" was not found. Run SetupDemo against the sandbox.`,
    )
  }
  return party
}

export async function resolvePartyIdForView(
  client: LedgerClient,
  partyViewId: string,
): Promise<string> {
  return resolvePartyId(client, partyHintForPartyView(partyViewId))
}
