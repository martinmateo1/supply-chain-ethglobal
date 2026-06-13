---
title: "Private Commodity Traceability on Canton"
status: "draft"
created: "2026-06-12"
updated: "2026-06-12"
---

# PRD: Private Commodity Traceability on Canton

## 0. Document Purpose

This PRD defines the MVP requirements for a Canton-first hackathon submission. It builds on the product brief at `_bmad-output/planning-artifacts/briefs/brief-hackaton-2026-06-12/brief.md` and will feed UX, architecture, epics, stories, and demo-script work.

The PRD uses stable Functional Requirement IDs (`FR-N`), User Journey IDs (`UJ-N`), and Success Metric IDs (`SM-N`). Technical architecture details belong in the later architecture workflow unless they are product constraints required for the Canton prize.

## 1. Vision

Private Commodity Traceability on Canton lets companies track the physical custody of certified commodities without exposing their full operating graph to competitors or unrelated network participants. A production site can originate a commodity lot, split it into transport loads, move it through storage, combine compatible inventory when needed, send it onward to port storage, and produce a custody-chain attestation for a selected quantity.

The core product bet is that traceability and privacy do not have to be opposites. A public ledger can make provenance transparent, but it also exposes stock levels, counterparties, routes, suppliers, and destination patterns. This product uses Canton because the hackathon demo must prove that a multi-company supply chain can be auditable while each company only sees the contracts and transfers it is entitled to see.

The MVP is commodity-generic. Coffee beans and cacao are seeded demo examples, but the product must support a commodity selector so the same custody model can apply to other agricultural or bulk commodities later.

## 2. Target Users

### 2.1 Jobs To Be Done

- Producers need to originate certified commodity lots with product, quantity, origin, quality, and certification metadata.
- Logistics operators need to accept and deliver custody of commodity quantities while attaching transport evidence.
- Storage operators need to receive, store, combine, split, and release quantities without exposing unrelated inventory.
- Port operators or exporters need to receive final inventory and generate a traceability attestation for a selected shipment.
- Auditors, buyers, or regulators need selective proof of a custody chain without receiving full ledger visibility.

### 2.2 Non-Users In V1

- Consumers scanning retail product labels.
- Financial institutions financing warehouse receipts or invoices.
- IoT providers streaming live GPS, weight, or sensor telemetry.
- Public marketplace buyers searching for commodity lots.
- Full enterprise ERP users who need production planning, accounting, or inventory reconciliation outside the traceability flow.

### 2.3 Key User Journeys

- **UJ-1. Ana creates a certified commodity lot at origin.**
  Ana is an operator at a certified farm or production site. She selects coffee beans or cacao from the commodity selector, enters quantity, origin coordinates or establishment identifier, quality grade, and certification metadata, then creates the initial Lot Position. She knows value landed when the lot appears in the origin site's holdings and is not visible to unrelated companies.

- **UJ-2. Bruno records truck custody with proof documents.**
  Bruno works for a logistics company. He receives an assigned transport quantity from a production site, uploads or references a transport sheet, and confirms destination details. The transfer binds the document hash to the custody event. He sees the transport leg and required evidence, but not the producer's other lots or the storage operator's balances.

- **UJ-3. Clara manages inbound storage and outbound aggregation.**
  Clara works for a storage operator. She receives multiple truck deliveries, stores compatible quantities, optionally combines lots from approved origins, then splits an outbound quantity for bulk transport to port storage. She knows the flow succeeded when inbound quantities are reflected in her storage holdings and the outbound transfer archives the previous position and creates the next custody position.

- **UJ-4. Mateo generates an export-ready custody-chain attestation.**
  Mateo works for a port operator or exporter. He selects a received quantity and generates a custody-chain attestation showing product, quantity, origin metadata, certifications, custody path, split/merge references, and document hashes. He can share the attestation with a buyer or auditor without granting them full access to every private ledger contract.

- **UJ-5. Vera verifies she cannot see unrelated data.**
  Vera represents a non-involved company in the demo. She switches into her party view and sees no private contracts, holdings, transfer details, documents, or balances for the coffee/cacao custody flow. This journey exists to prove the Canton privacy thesis.

## 3. Glossary

- **Attestation** — A generated proof artifact for a selected quantity that summarizes custody-chain details and evidence references.
- **Commodity** — The product type selected for a Lot Position, such as coffee beans, cacao, or another supported product.
- **Company** — A business participant that owns one or more Operational Nodes.
- **Custody Transfer** — A movement of quantity from one Operational Node to another, with authorization from the relevant parties and optional Evidence References.
- **Evidence Reference** — Off-ledger document metadata, hash, content identifier, credential identifier, or signed JSON reference bound to a Custody Transfer.
- **Lot Position** — A private ledger position representing a quantity of a Commodity held by an Operational Node, including provenance and certification metadata.
- **Operational Node** — A production site, transport wallet, storage wallet, or port storage wallet that can hold or move Lot Positions.
- **Party View** — The UI perspective for a selected Canton party or company role, showing only contracts and data visible to that party.
- **Provenance Link** — A reference connecting a derived Lot Position to its prior Lot Positions after split, merge, storage, or transfer activity.
- **Selective Visibility** — The product behavior where only involved or authorized parties can see relevant contracts, balances, transfers, evidence, or attestations.

## 4. Features

### 4.1 Commodity Lot Origination

**Description:** A producer creates an initial Lot Position for a selected Commodity. The MVP must use a generic Commodity selector and seed coffee beans and cacao as demo options. Origination captures the data needed for later traceability without implying financial ownership or payment settlement. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Select Commodity Type

A producer can select a Commodity when creating a Lot Position. Realizes UJ-1.

**Consequences:**
- The selector includes coffee beans and cacao as seeded demo Commodities.
- The data model does not hard-code logic to coffee beans or cacao only.
- The selected Commodity appears consistently in holdings, transfers, and Attestations.

#### FR-2: Create Origin Lot Position

A producer can create a Lot Position with Commodity, quantity, unit, origin coordinates or establishment identifier, quality grade, certification metadata, and current Operational Node. Realizes UJ-1.

**Consequences:**
- Created Lot Positions appear in the producer's Party View.
- Created Lot Positions are not visible to unrelated Company Party Views.
- Quantity, origin, quality, and certification fields are available for later Attestation generation.

#### FR-3: Preserve Certification Metadata

The system preserves certification metadata from the origin Lot Position through later Custody Transfers, splits, and merges. Realizes UJ-1, UJ-4.

**Consequences:**
- Certification metadata is present in derived Lot Positions unless explicitly marked incompatible or removed by a supported workflow.
- The MVP supports certification labels as structured metadata, not as free text only.
- [ASSUMPTION: The MVP does not validate certification authenticity beyond storing metadata and evidence references.]

### 4.2 Custody Transfer With Evidence

**Description:** Operational Nodes move quantities through Custody Transfers. A transfer records what moved, from where, to where, in what quantity, and with which Evidence References. The previous custody position should be archived or reduced and the new custody position should be created atomically in the Canton flow. Realizes UJ-2, UJ-3.

**Functional Requirements:**

#### FR-4: Initiate Custody Transfer

An authorized sender can initiate a Custody Transfer from a source Operational Node to a destination Operational Node for a selected quantity. Realizes UJ-2.

**Consequences:**
- Transfer quantity cannot exceed the available quantity in the source Lot Position.
- Transfer records source Operational Node, destination Operational Node, Commodity, quantity, and timestamp.
- The resulting destination Lot Position retains Provenance Links to the source Lot Position.

#### FR-5: Accept Custody Transfer

An authorized destination party can accept an inbound Custody Transfer. Realizes UJ-2, UJ-3.

**Consequences:**
- The destination party sees pending inbound transfers relevant to its Party View.
- Accepting the transfer creates or updates a destination Lot Position.
- Unrelated parties cannot see or accept the transfer.

#### FR-6: Attach Evidence References

An authorized party can attach Evidence References to a Custody Transfer. Realizes UJ-2.

**Consequences:**
- Evidence References support at least document name, document type, hash or content identifier, issuer, and timestamp.
- Supported document types include transport sheet, receipt, invoice, and other proof.
- The MVP stores file contents off-ledger or not at all; the ledger-bound data is the reference and hash.

#### FR-7: Show Transfer History In Party View

The UI shows inbound and outbound Custody Transfers visible to the selected Party View. Realizes UJ-2, UJ-3, UJ-5.

**Consequences:**
- Involved parties see transfer details relevant to their role.
- Non-involved parties do not see private transfers.
- Each visible transfer links to any visible Evidence References.

### 4.3 Split, Combine, And Storage Operations

**Description:** Storage and transport flows need quantity operations. One origin lot can be split across multiple trucks, and storage can combine compatible inbound lots before sending outbound quantities. The MVP must support enough split/combine behavior to demonstrate realistic custody without becoming a full inventory management system. Realizes UJ-2, UJ-3.

**Functional Requirements:**

#### FR-8: Split Lot Position

An authorized party can split a Lot Position into multiple child Lot Positions with quantities that sum to the parent quantity. Realizes UJ-2.

**Consequences:**
- Child Lot Positions preserve Commodity, certification metadata, and Provenance Links.
- The sum of child quantities equals the split quantity.
- The parent Lot Position is archived, reduced, or otherwise updated so total quantity is conserved.

#### FR-9: Combine Compatible Lot Positions

An authorized storage party can combine compatible Lot Positions into a new Lot Position. Realizes UJ-3.

**Consequences:**
- Combined Lot Positions must share compatible Commodity and certification metadata rules.
- The new Lot Position retains Provenance Links to all source Lot Positions.
- [ASSUMPTION: The MVP defines compatibility as same Commodity plus explicitly selected certification compatibility, not a full regulatory rules engine.]

#### FR-10: Create Outbound Quantity From Storage

An authorized storage party can create an outbound Custody Transfer for a selected quantity from stored inventory. Realizes UJ-3.

**Consequences:**
- The outbound quantity reduces or archives the relevant storage Lot Position.
- The outbound transfer retains Provenance Links needed for the later Attestation.
- Quantity conservation is enforced across inbound, stored, and outbound states.

### 4.4 Party Views And Selective Visibility

**Description:** The UI must make Canton privacy visible to judges. Users should be able to switch between demo Party Views and see different holdings, transfers, and Evidence References based on what each party is allowed to see. Realizes UJ-1 through UJ-5.

**Functional Requirements:**

#### FR-11: Switch Party View

A demo user can switch between preconfigured Party Views for producer, logistics operator, storage operator, port operator, and non-involved company. Realizes UJ-5.

**Consequences:**
- The active Party View is clearly displayed in the UI.
- Switching Party View changes visible holdings, transfers, and Attestations.
- The non-involved Party View does not reveal private coffee/cacao demo data.

#### FR-12: Show Visible Holdings

The UI shows Lot Positions visible to the active Party View. Realizes UJ-1, UJ-3, UJ-5.

**Consequences:**
- Producers see originated Lot Positions they are entitled to see.
- Logistics operators see transport custody positions relevant to their assigned legs.
- Storage and port operators see their own stored or received quantities.
- Unrelated companies see no private holdings from the demo flow.

#### FR-13: Explain Visibility Differences

The UI includes lightweight explanatory cues showing why a Party View can or cannot see a record. Realizes UJ-5.

**Consequences:**
- Demo screens communicate that visibility is role/party based, not missing data.
- The non-involved Party View has a clear empty state explaining that no contracts are visible.
- [ASSUMPTION: The MVP uses demo-friendly explanatory labels and does not expose raw Canton contract internals in the main UI.]

### 4.5 Custody-Chain Attestation

**Description:** A port operator or authorized party generates an Attestation for a selected quantity. The Attestation proves the full custody chain available to the issuing party, including quantities, custody path, provenance, certifications, and Evidence References. Realizes UJ-4.

**Functional Requirements:**

#### FR-14: Generate Attestation

An authorized party can generate an Attestation for a selected received quantity. Realizes UJ-4.

**Consequences:**
- The Attestation includes Commodity, quantity, origin metadata, certification metadata, custody path, split/combine references, Evidence References, issuer, recipient, timestamp, and verification status.
- The Attestation can be viewed in the UI after generation.
- The Attestation does not grant broad access to underlying private contracts.

#### FR-15: Share Selective Attestation View

An authorized party can share or present an Attestation to a buyer, auditor, or regulator without exposing unrelated holdings or transfers. Realizes UJ-4.

**Consequences:**
- The shared view contains the Attestation summary and verification metadata.
- The shared view includes document hashes/references, not raw private files unless access is separately granted.
- [ASSUMPTION: For the hackathon MVP, sharing may be represented by an in-app verifier view rather than a public hosted link.]

#### FR-16: Verify Evidence Binding

The system shows that Evidence References are bound to Custody Transfers included in an Attestation. Realizes UJ-4.

**Consequences:**
- The Attestation lists each included Evidence Reference and the transfer it supports.
- A verifier can inspect hash/reference values from the UI.
- The MVP does not need full third-party document authenticity verification.

## 5. Cross-Cutting Non-Functional Requirements

### 5.1 Privacy And Data Visibility

- **NFR-1:** The product must demonstrate that non-involved parties cannot see private Lot Positions, Custody Transfers, Evidence References, or balances.
- **NFR-2:** The product must avoid broad observer/signatory modeling that would make private supply-chain data visible to parties who do not need it.
- **NFR-3:** Party View switching must make visibility differences clear enough for a judge to understand during a short demo.

### 5.2 Data Integrity

- **NFR-4:** Quantity changes must conserve quantity across split, combine, transfer, and storage operations.
- **NFR-5:** Evidence References must remain linked to the relevant Custody Transfers used in an Attestation.
- **NFR-6:** Provenance Links must remain available for Attestation generation after split and combine operations.

### 5.3 Usability

- **NFR-7:** The MVP UI should support the full demo flow without requiring command-line steps during judging, except for setup or deployment.
- **NFR-8:** The active Party View, selected Commodity, current holdings, and transfer status must be obvious on screen.

### 5.4 Hackathon Delivery

- **NFR-9:** The MVP must be deployable or demoable with a README that covers setup, privacy model, architecture overview, known limitations, and demo script.
- **NFR-10:** The product should prioritize a crisp Canton privacy demo over broad supply-chain platform completeness.

## 6. Constraints And Guardrails

- Canton and Daml are required for core custody logic.
- React and TypeScript are preferred for the frontend and integration code.
- Supabase may be used only for minimal non-ledger data, such as document metadata, file references, or app convenience state.
- Privy is optional and should not be included unless it improves onboarding or custody UX without risking the Canton MVP.
- Evidence files should stay off-ledger in the MVP; hashes or references are ledger-bound.
- The MVP must model physical custody only, not commercial ownership or settlement.

## 7. Non-Goals

- The MVP is not a payment, financing, lending, invoice settlement, or warehouse receipt finance product.
- The MVP is not a consumer-facing retail traceability app.
- The MVP is not a full ERP, inventory accounting, or operations planning system.
- The MVP is not an IoT tracking platform.
- The MVP is not a public marketplace for commodity discovery.
- The MVP is not a complete verifiable credential or EAS-compatible attestation platform.
- The MVP is not required to validate real certification authenticity.

## 8. MVP Scope

### 8.1 In Scope

- Commodity selector with coffee beans and cacao as seeded demo examples.
- Creation of origin Lot Positions.
- Custody Transfers between Operational Nodes.
- Split and combine operations sufficient for the demo.
- Storage and port storage holdings.
- Evidence References attached to Custody Transfers.
- Party View switching across producer, logistics, storage, port, and non-involved company roles.
- Custody-chain Attestation generation and display.
- README and demo script focused on Canton privacy.

### 8.2 Out Of Scope For MVP

- Real document storage permissions beyond basic off-ledger references.
- Complex commodity-specific compliance rules.
- Live GPS, sensor, scale, or IoT integrations.
- Public sharing infrastructure beyond an in-app verifier view.
- Privy prize qualification unless explicitly chosen later.
- Multi-tenant production security hardening beyond what is needed for the demo.

## 9. Success Metrics

**Primary**

- **SM-1:** Complete custody demo in under 5 minutes, from origin lot to Attestation. Validates FR-1 through FR-16.
- **SM-2:** Party privacy demonstration succeeds: producer, logistics, storage, port, and non-involved Party Views show materially different data, with the non-involved party seeing no private demo flow records. Validates FR-11, FR-12, FR-13, NFR-1.
- **SM-3:** Attestation includes product, quantity, custody path, provenance, certifications, and Evidence References for a selected quantity. Validates FR-14, FR-15, FR-16.

**Secondary**

- **SM-4:** Quantity conservation is visible across split, combine, storage, and outbound transfer operations. Validates FR-8, FR-9, FR-10, NFR-4.
- **SM-5:** README explains setup, privacy model, architecture overview, known limitations, and demo script clearly enough for another developer or judge to run the project. Validates NFR-9.

**Counter-Metrics**

- **SM-C1:** Do not optimize for number of commodities supported. The selector proves generality, but demo clarity matters more than a long catalog.
- **SM-C2:** Do not optimize for number of attached document types. Evidence binding matters more than document-management depth.
- **SM-C3:** Do not optimize for broad data visibility. More visibility can make the app feel easier to demo but weakens the Canton privacy thesis.

## 10. Open Questions

1. Which exact demo Party names and Companies should be seeded?
2. Should the MVP represent transport vehicles as Operational Nodes, or represent transport companies with transport legs only?
3. What certification labels should the seeded coffee beans and cacao examples use?
4. Should Attestations be stored as Canton contracts, signed JSON documents, Supabase records with hashes, or a hybrid?
5. What is the minimum Privy integration, if any, that helps without distracting from Canton?
6. Should a buyer/auditor verifier Party View be separate from the port/exporter Party View?

## 11. Assumptions Index

- FR-3: The MVP does not validate certification authenticity beyond storing metadata and evidence references.
- FR-9: The MVP defines compatibility as same Commodity plus explicitly selected certification compatibility, not a full regulatory rules engine.
- FR-13: The MVP uses demo-friendly explanatory labels and does not expose raw Canton contract internals in the main UI.
- FR-15: For the hackathon MVP, sharing may be represented by an in-app verifier view rather than a public hosted link.
