#!/usr/bin/env tsx
/**
 * Negative test: double-spend attempt against Canton must fail.
 */
import { createLedgerClient, lotPositionTemplateId } from "../lib/ledger/client"
import { LedgerError, LedgerErrorCode } from "../lib/ledger/errors"
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

  if (!lot?.contractId) {
    throw new Error("No LotPosition found for production-site.")
  }

  const lotCid = lot.contractId

  await client.submitAndWaitForTransaction(
    [sender],
    [sender, receiver],
    [
      {
        ExerciseCommand: {
          templateId: lotPositionTemplateId(client),
          contractId: lotCid,
          choice: "InitiateTransfer",
          choiceArgument: {
            receiver,
            transferId: `t-ds-${Date.now()}`,
            transferAmount: "100.0",
            evidenceHashes: [],
          },
        },
      },
    ],
    `ds-init-${Date.now()}`,
  )

  try {
    await client.submitAndWaitForTransaction(
      [sender],
      [sender, receiver],
      [
        {
          ExerciseCommand: {
            templateId: lotPositionTemplateId(client),
            contractId: lotCid,
            choice: "InitiateTransfer",
            choiceArgument: {
              receiver,
              transferId: `t-ds-2-${Date.now()}`,
              transferAmount: "50.0",
              evidenceHashes: [],
            },
          },
        },
      ],
      `ds-repeat-${Date.now()}`,
    )
    throw new Error("Double-spend was not blocked.")
  } catch (error) {
    if (error instanceof Error && error.message === "Double-spend was not blocked.") {
      throw error
    }

    // The second submit must fail specifically because the source lot was
    // already consumed by the first (reserve-on-initiate archives it). Any
    // other failure (network, auth, package id) is NOT a passing double-spend
    // guard and must surface as a hard error.
    const isExpected =
      error instanceof LedgerError &&
      error.code === LedgerErrorCode.SOURCE_ASSET_ALREADY_CONSUMED
    const rawMessage = error instanceof Error ? error.message : String(error)
    const messageMatches =
      /contract not found|could not find contract|already consumed|no longer available/i.test(
        rawMessage,
      )

    if (!isExpected && !messageMatches) {
      console.error(
        "Second transfer failed, but NOT due to the source lot being consumed. " +
          "This is not a valid double-spend block:",
      )
      throw error
    }

    console.log("Double-spend blocked as expected (source lot already consumed).")
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
