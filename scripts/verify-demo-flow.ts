#!/usr/bin/env tsx
/**
 * End-to-end Canton custody verification against a running dpm sandbox.
 *
 * Requires:
 *   LEDGER_BACKEND=canton
 *   CANTON_LEDGER_HOST=http://localhost:6864
 *   CANTON_LEDGER_ID=sandbox
 *   CANTON_PACKAGE_ID=<package id from dpm inspect-dar>
 */
import { createLedgerClient, custodyTransferTemplateId, lotPositionTemplateId } from "../lib/ledger/client"
import { mapLotPayloadToLedgerLot } from "../lib/ledger/mappers"
import { resolvePartyId } from "../lib/ledger/party-config"

async function main() {
  const client = createLedgerClient()
  const sender = await resolvePartyId(client, "production-site")
  const receiver = await resolvePartyId(client, "truck-transport")

  const rows = await client.queryActiveContracts(sender)
  const lot = rows
    .map((row) => row.contractEntry?.JsActiveContract?.createdEvent)
    .find((event) =>
      event?.templateId?.endsWith(":Commodity.LotPosition:LotPosition"),
    )

  if (!lot?.contractId || !lot.createArgument) {
    throw new Error("No LotPosition found for production-site.")
  }

  const ledgerLot = mapLotPayloadToLedgerLot(lot.contractId, lot.createArgument)
  const transferAmount = Math.min(500, Number.parseFloat(ledgerLot.amount))

  const initiate = await client.submitAndWaitForTransaction(
    [sender],
    [sender, receiver],
    [
      {
        ExerciseCommand: {
          templateId: lotPositionTemplateId(client),
          contractId: lot.contractId,
          choice: "InitiateTransfer",
          choiceArgument: {
            receiver,
            transferId: `t-verify-${Date.now()}`,
            transferAmount: String(transferAmount),
            evidenceHashes: ["0xverify"],
          },
        },
      },
    ],
    `verify-init-${Date.now()}`,
  )

  const transferEvent = initiate.transaction?.events?.find(
    (event) => event.CreatedEvent?.templateId?.includes("CustodyTransfer"),
  )

  const transferCid = transferEvent?.CreatedEvent?.contractId
  if (!transferCid) {
    throw new Error("InitiateTransfer did not create a CustodyTransfer.")
  }

  const accept = await client.submitAndWaitForTransaction(
    [receiver],
    [receiver, sender],
    [
      {
        ExerciseCommand: {
          templateId: custodyTransferTemplateId(client),
          contractId: transferCid,
          choice: "AcceptTransfer",
          choiceArgument: {},
        },
      },
    ],
    `verify-accept-${Date.now()}`,
  )

  // Assert the accept actually created a LotPosition for the receiver at the
  // transferred amount — otherwise this is a smoke test, not a verification.
  const createdLotEvent = accept.transaction?.events?.find((event) =>
    event.CreatedEvent?.templateId?.endsWith(
      ":Commodity.LotPosition:LotPosition",
    ),
  )
  const createdLotArg = createdLotEvent?.CreatedEvent?.createArgument
  if (!createdLotArg) {
    throw new Error("AcceptTransfer did not create a LotPosition for the receiver.")
  }

  const receiverLot = mapLotPayloadToLedgerLot(
    createdLotEvent?.CreatedEvent?.contractId ?? "unknown",
    createdLotArg,
  )
  const receivedAmount = Number.parseFloat(receiverLot.amount)
  if (receivedAmount !== transferAmount) {
    throw new Error(
      `Receiver lot quantity mismatch: expected ${transferAmount}, got ${receivedAmount}.`,
    )
  }
  if (!receiverLot.owner.startsWith("truck-transport::")) {
    throw new Error(
      `Receiver lot owner mismatch: expected truck-transport party, got ${receiverLot.owner}.`,
    )
  }

  console.log(
    `Canton happy path verified: initiate -> accept (${receivedAmount} tons to receiver).`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
