---
name: "Private Commodity Traceability on Canton"
description: "A desktop web dashboard for demonstrating private commodity custody, evidence, and selective Canton visibility."
status: "draft"
created: "2026-06-13"
updated: "2026-06-13"
sources:
  - "../../prds/prd-hackaton-2026-06-12/prd.md"
  - "../../briefs/brief-hackaton-2026-06-12/brief.md"
  - "existing-screen-audit.md"
colors:
  # Inherits shadcn/Tailwind semantic tokens for background, foreground, card,
  # muted, border, input, ring, destructive, popover, and accent.
  primary: "#EAB308"
  primary-foreground: "#713F12"
  privacy: "#2563EB"
  privacy-foreground: "#FFFFFF"
  evidence: "#059669"
  evidence-foreground: "#FFFFFF"
  warning: "#F59E0B"
  warning-foreground: "#451A03"
  commodity-coffee: "#92400E"
  commodity-cacao: "#44403C"
  certification-non-gmo: "#047857"
  certification-deforestation-free: "#0369A1"
typography:
  body:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "1.5"
  label:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "1.25"
  caption:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "1.4"
  mono:
    fontFamily: "Geist Mono"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "1.4"
rounded:
  sm: "0.27rem"
  md: "0.36rem"
  lg: "0.45rem"
  xl: "0.63rem"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  dashboard-max-width: "56rem"
  side-panel-width: "420px"
components:
  app-shell:
    background: "shadcn muted"
    foreground: "shadcn foreground"
    maxWidth: "{spacing.dashboard-max-width}"
  party-switcher:
    background: "shadcn background"
    radius: "{rounded.full}"
    shadow: "shadcn shadow-lg"
  demo-stepper:
    activeColor: "{colors.primary}"
    privacyColor: "{colors.privacy}"
    radius: "{rounded.lg}"
  privacy-callout:
    border: "{colors.privacy}"
    foreground: "{colors.privacy}"
    radius: "{rounded.lg}"
  holdings-list:
    background: "shadcn background"
    radius: "{rounded.lg}"
  asset-row:
    imageRadius: "{rounded.xl}"
    badgeRadius: "{rounded.md}"
  transfer-history:
    background: "shadcn background"
    radius: "{rounded.lg}"
  transfer-row:
    iconSurface: "shadcn muted"
    badgeRadius: "{rounded.md}"
  transfer-panel:
    width: "{spacing.side-panel-width}"
    background: "shadcn background"
    border: "shadcn border"
  create-lot-panel:
    width: "{spacing.side-panel-width}"
    background: "shadcn background"
    border: "shadcn border"
  evidence-card:
    accent: "{colors.evidence}"
    hashTypography: "{typography.mono}"
    radius: "{rounded.lg}"
  asset-detail:
    maxWidth: "48rem"
    cardRadius: "{rounded.lg}"
  split-combine-indicator:
    color: "{colors.warning}"
    foreground: "{colors.warning-foreground}"
    radius: "{rounded.md}"
  attestation-panel:
    accent: "{colors.privacy}"
    radius: "{rounded.lg}"
  verifier-panel:
    accent: "{colors.privacy}"
    radius: "{rounded.lg}"
  empty-privacy-state:
    iconColor: "shadcn muted-foreground"
    border: "shadcn border dashed"
    radius: "{rounded.xl}"
---

# Private Commodity Traceability on Canton — Design Spine

## Brand & Style

This product is a proof-oriented operations dashboard. It should feel credible enough for supply-chain operators and legible enough for hackathon judges who have only minutes to understand the Canton privacy thesis. The existing shadcn/Tailwind surface is the right baseline: neutral panels, compact rows, clear labels, and restrained motion.

The visual identity adds one product layer on top of shadcn defaults: commodity custody is warm and material, privacy is blue and explicit, evidence is green and verifiable. The UI should not become a decorative supply-chain map. It is a working custody console with guided proof moments.

## Colors

Most chrome inherits shadcn semantic tokens. The product-specific colors are intentionally narrow:

- **Custody Yellow (`{colors.primary}`)** marks primary actions, current demo step, and custody progression. It should not be used for generic decoration.
- **Privacy Blue (`{colors.privacy}`)** marks party visibility explanations, verifier status, and Canton-specific proof callouts.
- **Evidence Green (`{colors.evidence}`)** marks document references, hashes, and evidence-bound transfers.
- **Warning Amber (`{colors.warning}`)** marks quantity conservation, implicit split/combine explanations, and incomplete attestation warnings.
- **Commodity Brown (`{colors.commodity-coffee}` / `{colors.commodity-cacao}`)** appears only in commodity metadata, imagery, and small labels; certification color carries the stronger state signal.

Avoid broad rainbow status systems. Judges should learn three meanings quickly: custody moved, privacy constrained visibility, evidence is bound.

## Typography

Inter is the functional UI typeface and should remain the default. Geist Mono is reserved for asset IDs, record IDs, origin fingerprints, hashes, and contract-like references.

Use ordinary sentence case for headings and labels. Uppercase is acceptable only for compact section labels already present in the current UI, such as "Current custody" and "Evidence references." Do not introduce marketing display typography into the dashboard.

## Layout & Spacing

The current layout is the contract: a desktop-first single dashboard with a maximum content width around `{spacing.dashboard-max-width}`, a fixed bottom-left party switcher, and a sliding side panel for mutating workflows.

Primary additions should reuse this model:

- Create lot, transfer, split/combine, and attestation generation should appear as side panels or contextual panels, not as unrelated full-page flows.
- The asset detail route remains the inspection surface for custody activity, evidence, privacy explanation, and attestation context.
- The guided demo layer should be compact: a top or inline stepper that frames the current custody stage without hiding the working dashboard.

## Elevation & Depth

Depth inherits shadcn defaults. Use shadows sparingly and only where the current UI already does: the floating party switcher and side panel separation. Most hierarchy should come from grouping, section headers, muted panels, and row density.

Do not add heavy card stacks, glassmorphism, map-like 3D depth, or animated route diagrams.

## Shapes

Use the existing rounded scale from the app CSS. Rows and badges are compact; panels and empty states are slightly softer. `rounded-full` is reserved for the floating party switcher and small circular icon containers.

## Components

- **App shell** — The existing `TraceabilityView` shell. Neutral muted page background, centered dashboard, fixed party switcher, and optional right-side workflow panel.
- **Party switcher** — Floating selector in the lower-left corner. Must display the active company role and total visible tons. When the non-involved company is selected, the zero state is a feature, not an error.
- **Demo stepper** — New guided layer. Shows the full custody route: Origin lot → Truck → Silo → Rail → Origin port → Ship → Destination port → Attestation → Privacy check. Active step uses `{colors.primary}`; privacy check uses `{colors.privacy}`.
- **Privacy callout** — Compact explanatory panel. Use whenever a party can or cannot see data. Must be prominent on dashboard, asset detail, verifier, and non-involved empty states.
- **Holdings list** — Existing `AssetsPanel` grouped by operational stage. Empty states should distinguish "no assets yet" from "no assets visible to this party."
- **Asset row** — Existing row with commodity image, quantity, grade, certifications, and detail link. Add optional split/combine badges only when they explain provenance.
- **Transfer history** — Existing sent/received history list. Add pending/accepted status later if FR-5 is implemented.
- **Transfer row** — Existing row with direction, counterparty, quantity, date, grade, certifications, and document count.
- **Transfer panel** — Existing side panel. Keep the form compact. Evidence upload stays in-panel and summary remains visible before confirmation.
- **Create lot panel** — New production-site-only side panel. Reuse transfer-panel density: commodity, quantity, unit, origin identifier/coordinates, quality grade, certifications, and optional evidence.
- **Evidence card** — Human-readable document card with name, type, issuer/timestamp when present, and a mono hash. Hash should be visible but not visually louder than the document meaning.
- **Asset detail** — Existing inspection route. Keep current custody, custody activity, evidence references, and attestation sections; promote attestation preview into a real generate/verify panel.
- **Split/combine indicator** — New inline explanation for partial transfers and compatible aggregation. It should show before quantity, after quantity, and why the certified quantity cannot be reused.
- **Attestation panel** — New destination-port action surface. Summarizes commodity, selected quantity, custody path, certifications, evidence cards, issuer, recipient, timestamp, and verification status.
- **Verifier panel** — New in-app shareable demo panel. Read-only. Shows exactly what a buyer/auditor can verify without receiving full ledger visibility.
- **Empty privacy state** — Strong non-involved-company state. Icon, one declarative headline, one Canton explanation, and an optional link to switch back to an involved party.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Reuse the existing shadcn dashboard and side-panel pattern | Replace the current UI with a separate design concept |
| Make party visibility explicit and repeated | Assume judges infer privacy from missing data |
| Show hashes inside evidence cards | Lead with raw hashes before human document meaning |
| Label implicit split/combine behavior | Let quantity conservation happen silently |
| Add the verifier as a focused in-app panel | Build a broad public-sharing system for MVP |
| Keep the dashboard desktop-first | Optimize for mobile field operations in the hackathon MVP |

