# Epic 4: Selective Attestation & Verifier Proof

Authorized destination or port users can generate and present a selective custody-chain attestation without exposing unrelated private ledger data.

## Story 4.1: Attestation Readiness Panel

As an authorized destination-port operator,
I want to see whether a received quantity is ready for attestation,
So that I know what custody, provenance, or evidence gaps must be resolved before generating proof.

**Requirements Covered:** FR14, FR16

**Acceptance Criteria:**

**Given** the active Party View is authorized for a received destination-port Lot Position
**When** the user opens asset detail
**Then** an Attestation panel is available
**And** it summarizes Commodity, quantity, current node, certifications, custody path status, evidence status, issuer, recipient, and verification readiness.

**Given** the custody chain is incomplete
**When** attestation readiness is evaluated
**Then** the panel explains which custody step, provenance reference, or evidence binding is missing
**And** the generate action is disabled or clearly marked unavailable.

**Given** evidence is missing for a custody step
**When** readiness is displayed
**Then** the panel shows a warning state
**And** the warning does not falsely imply complete evidence verification.

**Given** the active Party View is not authorized for the received quantity
**When** the user attempts to view attestation readiness
**Then** no private attestation details are shown
**And** the privacy message explains selective visibility.

**Given** earlier epics produced lot IDs, provenance references, and evidence records
**When** readiness is computed
**Then** the panel uses those existing data shapes
**And** it does not require rewriting prior custody history to generate proof.

**Given** attestation readiness evaluates a fixture with origin lot, accepted transfers, split/combine references, and evidence bindings
**When** readiness status is produced
**Then** the allowed input shape is constrained to selected quantity, issuer, recipient, visible custody path, provenance references, and evidence references
**And** hidden fields from unrelated parties remain unavailable to the readiness panel.

## Story 4.2: Generate Custody-Chain Attestation

As an authorized port or exporter operator,
I want to generate a custody-chain Attestation for a selected received quantity,
So that I can present product provenance and evidence without exposing the full private ledger.

**Requirements Covered:** FR14, FR15, FR16

**Acceptance Criteria:**

**Given** a received quantity is attestation-ready
**When** the authorized user generates an Attestation
**Then** the Attestation includes Commodity, quantity, origin metadata, certifications, custody path, split/combine references, Evidence References, issuer, recipient, timestamp, and verification status.

**Given** an Attestation is generated
**When** the output payload is stored or rendered
**Then** revealed fields are limited to the selected proof summary, custody path entries, provenance references, evidence hash/reference metadata, issuer, recipient, timestamp, and verification status
**And** hidden fields include unrelated holdings, unrelated balances, unrelated counterparties, raw private files, and broad underlying contract access.

**Given** the selected quantity is less than or equal to available received quantity
**When** the Attestation is generated
**Then** the selected quantity is represented accurately
**And** the system does not allow proof claims beyond the available certified quantity.

**Given** the custody chain includes split or combine operations
**When** the Attestation is generated
**Then** split/combine references are included in the proof summary
**And** source asset references remain traceable.

**Given** the generated Attestation references Evidence References
**When** the user views the Attestation
**Then** each evidence item is listed with the transfer leg it supports
**And** raw private files are not exposed unless separately authorized.

**Given** an unrelated Party View is active
**When** it attempts to access the generated Attestation details
**Then** private proof details are hidden
**And** broad access to underlying contracts is not granted.

## Story 4.3: In-App Verifier View

As a buyer, auditor, or regulator,
I want a read-only verifier view of a generated Attestation,
So that I can validate the selected custody-chain proof without seeing unrelated holdings or transfers.

**Requirements Covered:** FR15, FR16

**Acceptance Criteria:**

**Given** an Attestation has been generated
**When** the authorized user opens the verifier view
**Then** the view shows the Attestation summary, selected quantity, custody path, certifications, evidence hashes/references, issuer, recipient, timestamp, and verification status
**And** it does not show unrelated balances, unrelated holdings, or broad transfer tables.

**Given** the verifier inspects Evidence References
**When** evidence cards are displayed
**Then** each card shows human-readable document meaning first
**And** hash or content identifier values are visible, mono-styled, and selectable or copyable.

**Given** the verifier view is read-only
**When** the verifier interacts with the page
**Then** no custody actions, transfer actions, or ledger mutations are available
**And** the UI clearly distinguishes verifier proof from operator dashboards.

**Given** an Attestation contains warnings or incomplete evidence
**When** the verifier view opens
**Then** warning status is shown with the affected custody step
**And** the view does not claim stronger verification than the data supports.

**Given** the verifier view is used during judging
**When** the demo operator explains the proof
**Then** the page communicates selective disclosure in concise operator language
**And** the verifier can understand the proof without accessing the full app state.

**Given** the verifier payload is loaded
**When** the verifier inspects it
**Then** the payload exposes only fields explicitly allowed by the Attestation output shape
**And** missing, redacted, or unauthorized fields are not backfilled from dashboard state.

## Story 4.4: Evidence Binding and Privacy Verification

As a demo operator,
I want to prove that Attestation evidence is bound to specific custody transfers and remains selectively visible,
So that the final demo validates both traceability and Canton privacy.

**Requirements Covered:** FR13, FR15, FR16

**Acceptance Criteria:**

**Given** an Attestation includes one or more Evidence References
**When** the user inspects the Attestation or verifier view
**Then** each Evidence Reference is mapped to the Custody Transfer it supports
**And** the transfer leg, document metadata, and hash/reference are visible when authorized.

**Given** a custody transfer has no evidence
**When** it appears in an Attestation context
**Then** the UI identifies the missing evidence state
**And** it does not fabricate document hashes or proof status.

**Given** evidence metadata is tampered with or mismatched to a custody transfer
**When** evidence binding is verified
**Then** the verifier detects the mismatch or marks the evidence binding invalid
**And** the UI does not present the affected transfer as fully verified.

**Given** a non-involved Party View is selected
**When** the user attempts to inspect attestation, evidence, or custody details from the private route
**Then** the UI hides private details
**And** displays a privacy explanation consistent with the dashboard proof state.

**Given** involved parties have different visibility into the same commodity chain
**When** the demo operator switches between Party Views and the verifier view
**Then** each surface shows only the records that party or verifier is entitled to see
**And** the selective proof remains coherent without broad ledger visibility.

**Given** the deterministic role visibility matrix covers sender, receiver, current custodian, prior custodian, verifier, and non-involved company
**When** privacy verification is run
**Then** each role sees only the expected holdings, transfers, evidence, provenance, and attestation fields
**And** deviations from the matrix are treated as privacy failures.

**Given** the full demo flow is complete
**When** the judge follows origin lot creation, custody transfer, split/combine or route progression, attestation generation, verifier view, and non-involved privacy proof
**Then** the product demonstrates private commodity traceability end to end
**And** the result supports a sub-five-minute Canton-focused demo.
