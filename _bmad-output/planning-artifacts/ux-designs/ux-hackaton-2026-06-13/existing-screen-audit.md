# Existing Screen Audit

## Source Screens

The current product is a Next.js 16 App Router dashboard with two wired routes:

| Route | Screen | Primary coverage |
|---|---|---|
| `/` | `components/traceability-view.tsx` | Party switcher, holdings, transfer history, transfer side panel |
| `/assets/[id]` | `components/asset-detail-view.tsx` | Lot detail, party visibility gate, custody activity, evidence hashes, attestation preview |

Important supporting components:

| Component | Path | Coverage |
|---|---|---|
| Assets panel | `components/assets-panel.tsx` | Visible holdings and empty state |
| History panel | `components/history-panel.tsx` | Sent/received custody transfer history |
| Transfer panel | `components/transfer-panel.tsx` | Initiate transfer with quantity and evidence attachments |
| Certificate dropzone | `components/certificate-dropzone.tsx` | Document reference upload and hash display |
| Store | `lib/store.ts` | Seed state, party switch, transfers, implicit partial quantity movement |
| Seed data | `lib/data.ts` | Seven operational nodes and seeded custody transfers |
| Provenance helpers | `lib/provenance.ts` | Asset visibility and fingerprint helpers |

## Coverage Map

| PRD area | Existing coverage | UX verdict |
|---|---|---|
| UJ-1 / FR-1-FR-3: origin lot creation | Seeded production-site assets only | Gap: needs create-lot action or demo step |
| UJ-2 / FR-4-FR-7: custody transfer with evidence | Transfer panel supports selected asset, quantity, destination, and evidence attachments | Partial: no pending inbound accept/reject step |
| UJ-3 / FR-8-FR-10: split/combine/storage operations | Partial quantity transfer implicitly splits; destination auto-merges compatible assets | Gap: behavior is silent and lacks explicit split/combine explanation |
| UJ-4 / FR-14-FR-16: custody-chain attestation | Asset detail includes static attestation preview | Gap: no generate action, verifier panel, share state, or verification status |
| UJ-5 / FR-11-FR-13: selective party visibility | Party switcher plus unauthorized asset detail state | Gap: no non-involved company party; dashboard does not make privacy proof prominent enough |

## Correctness Observations

- The current single-dashboard structure matches the UX direction chosen in discovery.
- The seeded full chain matches the brief's operational route: production, truck, silo, rail, origin port, ship, destination port.
- The asset detail visibility gate correctly explains that non-authorized parties cannot view a lot, but the demo lacks a non-involved party to prove that path from the main dashboard.
- Transfers currently confirm immediately. This is acceptable for a fast demo if framed as a sender-side custody event, but it does not satisfy PRD FR-5 without an explicit pending/accept state.
- Silent destination auto-merge is a UX risk: it may demonstrate compatibility internally, but judges will not see provenance, conservation, or anti-double-spend behavior.
- The static attestation preview is useful scaffolding, but it is not yet the in-app verifier view chosen during UX discovery.

## Recommended Gap Fill

1. Add a non-involved company party with a strong dashboard empty state explaining Canton selective visibility.
2. Add guided demo callouts or a compact stepper around the existing dashboard so judges understand where they are in the chain.
3. Add origin lot creation as a production-site-only panel or modal, reusing the existing transfer-panel pattern.
4. Make split/combine explicit in copy and UI: label partial transfer as a split, label compatible destination aggregation as a combine, and show quantity conservation.
5. Promote attestation preview into a generate-and-verify panel for destination-port assets, including custody path, evidence cards, issuer/recipient, and verification status.
6. Add pending inbound transfer acceptance for FR-5, or explicitly descope FR-5 before implementation; do not imply FR-5 is complete with immediate confirmation only.
