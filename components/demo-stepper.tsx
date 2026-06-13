"use client"

import { NON_INVOLVED_PARTY_VIEW_ID } from "@/lib/demo/party-views"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DemoStep = {
  id: string
  label: string
  partyViewId: string
  isPrivacy?: boolean
}

export const DEMO_STEPS: DemoStep[] = [
  { id: "origin-lot", label: "Origin lot", partyViewId: "production-site" },
  { id: "truck", label: "Truck", partyViewId: "truck-transport" },
  { id: "silo", label: "Silo", partyViewId: "silo" },
  { id: "rail", label: "Rail", partyViewId: "railway-transport" },
  { id: "origin-port", label: "Origin port", partyViewId: "origin-port" },
  { id: "ship", label: "Ship", partyViewId: "ship" },
  {
    id: "destination-port",
    label: "Destination port",
    partyViewId: "destination-port",
  },
  {
    id: "attestation",
    label: "Attestation",
    partyViewId: "destination-port",
  },
  {
    id: "privacy-check",
    label: "Privacy check",
    partyViewId: NON_INVOLVED_PARTY_VIEW_ID,
    isPrivacy: true,
  },
]

function activeStepForPartyView(partyViewId: string): DemoStep {
  if (partyViewId === NON_INVOLVED_PARTY_VIEW_ID) {
    return DEMO_STEPS[DEMO_STEPS.length - 1]
  }

  const match = [...DEMO_STEPS]
    .reverse()
    .find(
      (step) =>
        step.partyViewId === partyViewId &&
        step.id !== "attestation"
    )

  if (partyViewId === "destination-port") {
    return DEMO_STEPS.find((step) => step.id === "attestation") ?? DEMO_STEPS[6]
  }

  return match ?? DEMO_STEPS[0]
}

type DemoStepperProps = {
  selectedPartyViewId: string
  onSelectPartyView: (partyViewId: string) => void
}

export function DemoStepper({
  selectedPartyViewId,
  onSelectPartyView,
}: DemoStepperProps) {
  const activeStep = activeStepForPartyView(selectedPartyViewId)

  function handleValueChange(stepId: string) {
    const step = DEMO_STEPS.find((s) => s.id === stepId)
    if (step) onSelectPartyView(step.partyViewId)
  }

  return (
    <Select value={activeStep.id} onValueChange={handleValueChange}>
      <SelectTrigger
        size="sm"
        aria-label="Demo custody route"
        className="h-6 min-h-0 w-auto max-w-40 gap-1 rounded-md border-border/60 bg-transparent px-2 py-0 text-xs shadow-none"
      >
        <span className="text-muted-foreground">Demo</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {DEMO_STEPS.map((step) => (
          <SelectItem key={step.id} value={step.id}>
            {step.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
