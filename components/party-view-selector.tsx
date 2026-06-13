"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEMO_PARTY_VIEWS,
  isRoutePartyView,
  partyViewById,
  partyViewLabel,
  partyViewNodeLabel,
  partyViewRoleLabel,
} from "@/lib/demo/party-views"
import { useTraceabilityStore } from "@/lib/store"
import { STAGE_META } from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type PartyViewSelectorProps = {
  selectedPartyViewId: string
  onSelectPartyView: (partyViewId: string) => void
  className?: string
}

export function PartyViewSelector({
  selectedPartyViewId,
  onSelectPartyView,
  className,
}: PartyViewSelectorProps) {
  const accounts = useTraceabilityStore((state) => state.accounts)
  const partyViewVisibleTotalTons = useTraceabilityStore(
    (state) => state.partyViewVisibleTotalTons
  )

  const selectedPartyView = partyViewById(selectedPartyViewId)
  const visibleTotalTons = partyViewVisibleTotalTons(selectedPartyViewId)

  return (
    <div className={cn("min-w-0", className)}>
      <Label htmlFor="party-view-selector" className="sr-only">
        Party View
      </Label>
      <Select value={selectedPartyViewId} onValueChange={onSelectPartyView}>
        <SelectTrigger
          id="party-view-selector"
          size="sm"
          className="h-7 max-w-[min(100vw-8rem,28rem)] rounded-full border-0 bg-transparent shadow-none"
        >
          {selectedPartyView ? (
            <span className="truncate text-left text-xs">
              <span className="font-medium">
                {partyViewLabel(selectedPartyView)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · {partyViewRoleLabel(selectedPartyView)}
                {partyViewNodeLabel(selectedPartyView)
                  ? ` · ${partyViewNodeLabel(selectedPartyView)}`
                  : ""}{" "}
                · {formatTons(visibleTotalTons)}t
              </span>
            </span>
          ) : (
            <SelectValue placeholder="Select a Party View" />
          )}
        </SelectTrigger>
        <SelectContent side="bottom" position="popper" align="start">
          {DEMO_PARTY_VIEWS.map((view) => {
            const totalTons = partyViewVisibleTotalTons(view.id)
            const nodeLabel = partyViewNodeLabel(view)
            const roleLabel = partyViewRoleLabel(view)
            const StageIcon = view.operationalNodeId
              ? STAGE_META[
                  accounts.find((a) => a.id === view.operationalNodeId)
                    ?.stageType ?? "production"
                ].icon
              : null

            return (
              <SelectItem key={view.id} value={view.id}>
                {StageIcon ? (
                  <StageIcon className="size-4 text-muted-foreground" />
                ) : null}
                <span className="min-w-0 truncate">{partyViewLabel(view)}</span>
                <span className="text-muted-foreground">
                  {isRoutePartyView(view)
                    ? `(${formatTons(totalTons)}t)`
                    : view.companyRole === "non-involved"
                      ? "(unrelated)"
                      : `(${formatTons(totalTons)}t)`}
                </span>
                <span className="sr-only">
                  {roleLabel}
                  {nodeLabel ? ` · ${nodeLabel}` : ""}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
