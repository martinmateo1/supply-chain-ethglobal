# Epic 3: Split, Combine & Multi-Leg Storage Operations

Storage and logistics operators can split, combine, conserve, and move quantities across the full custody route while preserving provenance.

## Story 3.1: Partial Transfer Split with Conservation Feedback

As a custody operator,
I want partial transfers to explicitly split Lot Positions,
So that quantity conservation and provenance remain understandable when only part of a holding moves.

**Requirements Covered:** FR8, FR10

**Acceptance Criteria:**

**Given** a source Lot Position has available quantity
**When** the user initiates a transfer for less than the full quantity
**Then** the operation creates a transferred child position and a remaining source position or equivalent ledger state
**And** the child and remaining quantities sum to the original quantity.

**Given** the deterministic split fixture starts with a known source quantity
**When** split tests run
**Then** transferred quantity plus retained quantity equals the source quantity exactly
**And** rounding, unit conversion, or display formatting cannot hide conservation errors.

**Given** a partial transfer is reviewed
**When** the summary is displayed
**Then** the UI labels the operation as a split
**And** shows before quantity, transfer quantity, remaining quantity, and source reference.

**Given** the split transfer is accepted
**When** the destination party views the received holding
**Then** the received Lot Position preserves Commodity, certification metadata, and Provenance Links
**And** unrelated parties cannot see split details unless entitled.

**Given** the user attempts a split with invalid quantity
**When** the requested amount is zero, negative, or greater than available quantity
**Then** the operation is blocked
**And** the UI explains the quantity conservation rule.

**Given** split data is later used for attestation
**When** provenance is read
**Then** the source and derived references remain available
**And** the attestation workflow can distinguish transferred quantity from remaining balance.

## Story 3.2: Compatible Lot Combine at Storage

As a storage operator,
I want to combine compatible received Lot Positions,
So that stored inventory can be aggregated without losing provenance or certification meaning.

**Requirements Covered:** FR9

**Acceptance Criteria:**

**Given** the active Party View is a storage Operational Node
**When** compatible Lot Positions are visible
**Then** the UI offers a combine action or clearly explains automatic compatible aggregation
**And** compatibility is based on same Commodity plus supported certification compatibility rules.

**Given** selected Lot Positions are compatible
**When** the storage operator confirms combine
**Then** a combined Lot Position is created or updated
**And** the combined quantity equals the sum of the source quantities.

**Given** the deterministic combine fixture includes compatible and incompatible lots
**When** combine tests run
**Then** only compatible Commodity and certification combinations can combine
**And** incompatible lots remain separate with their original quantities and provenance intact.

**Given** source Lot Positions are combined
**When** the combined holding is inspected
**Then** the UI shows source references, before quantities, combined quantity, and certification compatibility
**And** Provenance Links to all source positions remain available.

**Given** selected Lot Positions are incompatible
**When** the storage operator attempts to combine them
**Then** the action is blocked
**And** the UI explains which Commodity or certification rule prevents the combine.

**Given** a combined Lot Position is later transferred or attested
**When** downstream workflows read provenance
**Then** all source Lot Positions remain traceable
**And** evidence and certifications are not silently dropped.

## Story 3.3: Outbound Storage Transfer Across the Demo Route

As a storage or logistics operator,
I want to send stored quantities onward through rail, port, ship, and destination-port custody,
So that the demo can show a complete multi-leg custody chain.

**Requirements Covered:** FR4, FR7, FR10

**Acceptance Criteria:**

**Given** a storage, rail, origin-port, ship, or destination-port Party View has visible custody holdings
**When** the operator initiates an outbound transfer
**Then** the destination options reflect the configured custody route where appropriate
**And** the transfer preserves Commodity, quantity, certifications, evidence references, and Provenance Links.

**Given** an outbound transfer is accepted by the destination party
**When** the source and destination holdings update
**Then** source quantity is reduced or archived according to the custody model
**And** destination quantity is created or updated without violating conservation.

**Given** the custody route progresses through multiple Operational Nodes
**When** the user switches Party Views
**Then** each party sees only the holdings and transfers relevant to its custody step
**And** the non-involved company continues to see no private route data.

**Given** evidence is attached to one or more route legs
**When** asset detail or history is inspected
**Then** the evidence remains bound to the transfer leg it supports
**And** later legs do not imply evidence that was never attached.

**Given** the demo operator reaches destination-port custody
**When** the received quantity is inspected
**Then** the Lot Position has enough custody path and provenance context to support attestation availability checks.

## Story 3.4: Provenance Timeline and Anti-Double-Spend Checks

As a demo operator,
I want to see provenance and conservation checks across split, combine, and transfer operations,
So that judges can trust that certified quantities are not reused or silently mutated.

**Requirements Covered:** FR8, FR9, FR10, FR14, FR16

**Acceptance Criteria:**

**Given** a Lot Position has split, combine, or multi-leg custody history
**When** the user opens asset detail
**Then** the UI shows a provenance timeline or structured custody path
**And** each step identifies operation type, parties, quantity, and source/derived references.

**Given** a custody operation changes quantity
**When** the operation completes
**Then** the system records enough data to prove before quantity, after quantity, and conserved total
**And** the UI surfaces the conservation result where it matters for demo understanding.

**Given** a certified source quantity has been consumed, archived, or allocated
**When** an operation attempts to reuse the same consumed source quantity beyond its remaining balance
**Then** the operation is rejected
**And** a test or scripted demo can show the failed double-spend attempt.

**Given** anti-double-spend is represented in this story
**When** implementation scopes the UI
**Then** the required UI is limited to a clear failed-operation status or warning
**And** any full graph visualization is out of scope unless explicitly split into a later story.

**Given** provenance data includes private party activity
**When** an entitled party views the timeline
**Then** only custody details visible to that Party View are shown
**And** private records belonging only to other parties are not exposed.

**Given** the provenance timeline is used by attestation generation
**When** the destination-port operator requests an attestation
**Then** the attestation workflow can read source references, split/combine references, custody path, and evidence bindings without rewriting prior state.
