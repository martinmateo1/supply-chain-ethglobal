#!/usr/bin/env node
import { SEED_ASSETS, SEED_TRANSFERS } from "@/lib/data"
import {
  DEMO_PARTY_VIEWS,
  NON_INVOLVED_PARTY_VIEW_ID,
  VERIFIER_PARTY_VIEW_ID,
} from "@/lib/demo/party-views"
import {
  snapshotPartyVisibility,
  verifyVisibilityMatrix,
} from "@/lib/demo/visibility-matrix"

function main() {
  const { ok, failures } = verifyVisibilityMatrix(SEED_ASSETS, SEED_TRANSFERS)

  if (!ok) {
    console.error("Party visibility matrix verification failed:")
    for (const failure of failures) {
      console.error(`  - ${failure}`)
    }
    process.exit(1)
  }

  console.log("Party visibility matrix verification passed.")
  for (const view of DEMO_PARTY_VIEWS) {
    const snapshot = snapshotPartyVisibility(view.id, SEED_ASSETS, SEED_TRANSFERS)
    console.log(
      [
        view.id,
        `holdings=${snapshot.visibleHoldings.length}`,
        `sent=${snapshot.visibleTransfersSent.length}`,
        `received=${snapshot.visibleTransfersReceived.length}`,
        `evidence=${snapshot.visibleEvidenceCount}`,
      ].join(" ")
    )
  }

  const nonInvolved = snapshotPartyVisibility(
    NON_INVOLVED_PARTY_VIEW_ID,
    SEED_ASSETS,
    SEED_TRANSFERS
  )
  const verifier = snapshotPartyVisibility(
    VERIFIER_PARTY_VIEW_ID,
    SEED_ASSETS,
    SEED_TRANSFERS
  )

  if (nonInvolved.visibleHoldings.length > 0 || nonInvolved.visibleTransfersSent.length > 0) {
    console.error("Non-involved company must not see private demo records.")
    process.exit(1)
  }

  if (verifier.visibleHoldings.length > 0) {
    console.error("Verifier party view should not expose custody holdings in story 1.1.")
    process.exit(1)
  }
}

main()
