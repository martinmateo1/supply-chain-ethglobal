import { Shield } from "lucide-react"

import { partyViewRoleLabel, type PartyView } from "@/lib/demo/party-views"
import { isPrivatePartyView } from "@/lib/provenance"

type PrivacyCalloutProps = {
  partyView: PartyView
}

export function PrivacyCallout({ partyView }: PrivacyCalloutProps) {
  const roleLabel = partyViewRoleLabel(partyView)

  return (
    <div
      className="mb-6 flex gap-3 rounded-lg border border-blue-600/30 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-100"
      role="note"
    >
      <Shield className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-300" />
      <div className="space-y-1">
        <p className="font-medium">Canton selective visibility</p>
        <p className="text-blue-900/90 dark:text-blue-100/90">
          {isPrivatePartyView(partyView.id) ? (
            <>
              This Party View is unrelated to the demo custody route. Empty
              holdings and history reflect Canton privacy — not missing data or
              a loading error.
            </>
          ) : (
            <>
              Holdings and custody transfers shown here are visible only to{" "}
              <span className="font-medium">{roleLabel}</span> parties entitled
              on Canton. Other companies cannot see these private records.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
