import { partyViewById } from "@/lib/demo/party-views"
import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"

/** Maps a UI Party View id to the operational node id used in custody state. */
export function operationalNodeForPartyView(partyViewId: string): string | null {
  return partyViewById(partyViewId)?.operationalNodeId ?? null
}

export function assertSenderPartyView(
  partyViewId: string,
  fromAccountId: string
): void {
  const nodeId = operationalNodeForPartyView(partyViewId)
  if (!nodeId || nodeId !== fromAccountId) {
    throw new LedgerError(
      LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
      "This Party View cannot initiate a transfer from the selected operational node."
    )
  }
}

export function assertRecipientPartyView(
  partyViewId: string,
  toAccountId: string
): void {
  const nodeId = operationalNodeForPartyView(partyViewId)
  if (!nodeId || nodeId !== toAccountId) {
    throw new LedgerError(
      LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
      "This Party View cannot accept or reject this inbound transfer."
    )
  }
}

/** Only the production-site operational node may originate lots. */
export function assertOriginLotProducer(
  partyViewId: string,
  accountId: string,
): void {
  const nodeId = operationalNodeForPartyView(partyViewId)
  if (!nodeId || nodeId !== accountId || accountId !== "production-site") {
    throw new LedgerError(
      LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
      "Only the production-site Party View can create origin lots.",
    )
  }
}

export function assertTransferParticipant(
  partyViewId: string,
  fromAccountId: string,
  toAccountId: string
): void {
  const nodeId = operationalNodeForPartyView(partyViewId)
  if (!nodeId || (nodeId !== fromAccountId && nodeId !== toAccountId)) {
    throw new LedgerError(
      LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
      "This Party View is not entitled to view or act on this custody transfer."
    )
  }
}
