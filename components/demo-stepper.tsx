"use client"

import { ChevronRight } from "lucide-react"

import {
  NON_INVOLVED_PARTY_VIEW_ID,
} from "@/lib/demo/party-views"
import { cn } from "@/lib/utils"

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

  return (
    <nav
      aria-label="Demo custody route"
      className="mb-6 overflow-x-auto rounded-lg border border-border/60 bg-background/80 px-3 py-3"
    >
      <ol className="flex min-w-max items-center gap-1">
        {DEMO_STEPS.map((step, index) => {
          const isActive = step.id === activeStep.id
          const isAttestationHint =
            step.id === "attestation" &&
            selectedPartyViewId === "destination-port" &&
            activeStep.id === "attestation"

          return (
            <li key={step.id} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground/50"
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                onClick={() => onSelectPartyView(step.partyViewId)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && step.isPrivacy
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                    : isActive || isAttestationHint
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">
        Guided demo route — switch Party Views to show Canton selective visibility
        at each custody stage.
      </p>
    </nav>
  )
}
