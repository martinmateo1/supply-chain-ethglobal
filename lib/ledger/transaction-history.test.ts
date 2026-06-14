import { describe, expect, it } from "vitest"

import {
  completedTransfersForParty,
  flattenUpdateRows,
  foldCompletedCustodyTransfers,
} from "@/lib/ledger/transaction-history"

const sender = "production-site::abc"
const receiver = "truck-transport::def"
const transferContractId = "transfer-cid-1"
const packageId = "pkg"

const createTransferUpdate = {
  update: {
    Transaction: {
      value: {
        commandId: "initiate-1",
        effectiveAt: "2026-06-14T00:00:00.000Z",
        events: [
          {
            CreatedEvent: {
              contractId: transferContractId,
              templateId: `${packageId}:Commodity.LotPosition:CustodyTransfer`,
              createArgument: {
                transferId: "t-1",
                sender,
                receiver,
                commodity: "Coffee",
                quantity: { amount: "50.0", unit: "tons" },
                certifications: ["NonGMO"],
                quality: "GradeA",
                originIdentifier: "origin-1",
                sourceLotId: "lot-1",
                evidenceHashes: ["0xproof"],
                provenance: [],
                status: "Pending",
              },
              createdAt: "2026-06-14T00:00:00.000Z",
            },
          },
        ],
      },
    },
  },
}

const senderAcceptArchiveOnlyUpdate = {
  update: {
    Transaction: {
      value: {
        commandId: "",
        effectiveAt: "2026-06-14T00:05:00.000Z",
        events: [
          {
            ArchivedEvent: {
              contractId: transferContractId,
              templateId: `${packageId}:Commodity.LotPosition:CustodyTransfer`,
            },
          },
        ],
      },
    },
  },
}

describe("transaction history folding", () => {
  it("keeps completed sent transfers when caller passes flattened update events", () => {
    const flattened = flattenUpdateRows([
      createTransferUpdate,
      senderAcceptArchiveOnlyUpdate,
    ])
    const completed = foldCompletedCustodyTransfers(flattened)
    const history = completedTransfersForParty(completed, "production-site")

    expect(history.sent).toHaveLength(1)
    expect(history.sent[0]).toMatchObject({
      id: "t-1",
      fromAccountId: "production-site",
      toAccountId: "truck-transport",
      status: "accepted",
      occurredAt: "2026-06-14T00:05:00.000Z",
    })
  })
})
