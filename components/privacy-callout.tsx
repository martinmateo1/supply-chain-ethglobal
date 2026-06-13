import { partyViewRoleLabel, type PartyView } from "@/lib/demo/party-views"
import { isPrivatePartyView } from "@/lib/provenance"

type PrivacyCalloutProps = {
  partyView: PartyView
}

export function PrivacyCallout({ partyView }: PrivacyCalloutProps) {
  const roleLabel = partyViewRoleLabel(partyView)

  return (
    <footer
      className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground"
      role="note"
      aria-label="Canton selective visibility"
    >
      <p className="font-medium text-foreground">Canton selective visibility</p>
      <p className="mt-1">
        {isPrivatePartyView(partyView.id) ? (
          <>
            This Party View is unrelated to the demo custody route. Empty
            holdings and history reflect Canton privacy — not missing data or a
            loading error.
          </>
        ) : (
          <>
            Holdings and custody transfers shown here are visible only to{" "}
            <span className="font-medium text-foreground">{roleLabel}</span>{" "}
            parties entitled on Canton. Other companies cannot see these private
            records.
          </>
        )}
      </p>
    </footer>
  )
}
