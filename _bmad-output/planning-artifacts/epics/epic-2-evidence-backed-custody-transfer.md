# Epic 2: Evidence-Backed Custody Transfer

Supply-chain operators can initiate, review, accept, and inspect custody transfers with evidence references bound to each movement.

## Story 2.1: Custody Transfer Request with Evidence

As a sending custody operator,
I want to initiate a Custody Transfer for a selected quantity with supporting evidence,
So that a downstream party can receive a specific commodity quantity with proof bound to the handoff.

**Requirements Covered:** FR4, FR6

**Acceptance Criteria:**

**Given** the active Party View holds at least one visible Lot Position
**When** the user opens the Transfer side panel
**Then** the panel shows sender, selectable source Lot Position, quantity, destination Operational Node, evidence upload/reference, and review summary
**And** the side panel follows the existing dashboard interaction pattern.

**Given** the user selects a source Lot Position
**When** the user enters transfer details
**Then** the transfer records source Operational Node, destination Operational Node, Commodity, quantity, unit, timestamp intent, and source provenance reference
**And** the selected quantity cannot exceed available quantity.

**Given** the user attaches evidence
**When** the transfer request is reviewed
**Then** each Evidence Reference includes document name, document type, hash or content identifier, issuer when available, and timestamp
**And** raw file contents are not treated as ledger custody state.

**Given** the transfer request is valid
**When** the sender confirms
**Then** the system creates a pending Custody Transfer visible to the sender and intended recipient
**And** unrelated Party Views cannot see the pending transfer details or evidence references.

**Given** a transfer request is pending
**When** the sender attempts to spend the same pending quantity again
**Then** the system blocks double-spending of the reserved quantity
**And** the UI explains that the quantity is locked by a pending inbound transfer.

**Given** the transfer submission fails validation or ledger/API processing
**When** the error is displayed
**Then** the user sees an actionable message without private details leaking to unrelated parties
**And** the source Lot Position remains unchanged until the transfer can be accepted.

## Story 2.2: Pending Inbound Transfer Acceptance

As a destination custody operator,
I want to accept or reject pending inbound Custody Transfers,
So that custody only changes hands when the receiving party explicitly acts.

**Requirements Covered:** FR4, FR5

**Acceptance Criteria:**

**Given** a pending Custody Transfer targets the active Party View
**When** the destination operator opens the dashboard or History tab
**Then** the pending inbound transfer is shown in a distinct pending section
**And** the operator can inspect commodity, quantity, sender, destination, evidence count, and source provenance summary.

**Given** a pending transfer is visible to the destination operator
**When** the operator accepts it
**Then** the destination Lot Position is created or updated
**And** the source Lot Position is archived, reduced, or otherwise updated according to the custody model.

**Given** custody state is pending
**When** any party other than the intended destination attempts to accept the transfer
**Then** the action is rejected
**And** only the current custodian can initiate further transfers after acceptance.

**Given** a pending transfer is visible to the destination operator
**When** the operator rejects it
**Then** custody does not move to the destination party
**And** the sender and recipient can see the rejected status only if they are entitled to that transfer.

**Given** an unrelated Party View is active
**When** pending transfers exist between other parties
**Then** the unrelated party cannot see, accept, reject, or infer the pending transfer.

**Given** a transfer has already been accepted or rejected
**When** either party tries to repeat the same action
**Then** the system prevents duplicate state transitions
**And** the UI explains the current transfer status.

**Given** the transfer state is pending, accepted, rejected, or cancelled
**When** the UI renders available actions
**Then** only state-valid actions are enabled
**And** rejected or cancelled transfers do not change destination custody or available source balance.

## Story 2.3: Party-Visible Transfer History and Evidence Cards

As an involved custody operator,
I want to inspect sent and received transfer history with evidence references,
So that I can understand the custody events visible to my Party View.

**Requirements Covered:** FR6, FR7

**Acceptance Criteria:**

**Given** the active Party View has completed transfers
**When** the user opens the History tab
**Then** sent and received transfers are grouped clearly
**And** each transfer row shows counterparty, commodity, quantity, unit, date, status, certification labels, and evidence count.

**Given** a transfer includes Evidence References
**When** the transfer row or related detail view is inspected
**Then** evidence cards show human-readable document meaning before hashes
**And** hashes or content identifiers use mono typography and are selectable or copyable where practical.

**Given** the active Party View is not involved in a transfer
**When** transfer history is rendered
**Then** the transfer and its evidence references are not shown
**And** aggregate totals do not reveal private activity.

**Given** the user opens an asset detail page for a visible Lot Position
**When** related custody activity is listed
**Then** only transfers visible to the selected Party View are displayed
**And** the visibility explanation remains consistent with the dashboard.

**Given** no transfer history is visible
**When** the History tab renders
**Then** the empty state distinguishes between no activity yet and no activity visible because of selective privacy
**And** the copy does not imply a broken data load.

## Story 2.4: Ledger Gateway Boundaries for Custody Actions

As a custody operator,
I want transfer actions to be submitted through a reliable application boundary,
So that custody state changes are authorized, traceable, and not dependent on client-only mutations.

**Requirements Covered:** FR4, FR5, FR6, FR7

**Acceptance Criteria:**

**Given** the user submits a create-transfer, accept-transfer, or reject-transfer action
**When** the app processes the request
**Then** the browser calls a named Next.js gateway action or route rather than constructing raw Canton commands
**And** the response uses the shared success/error envelope.

**Given** a Party View is active
**When** a custody action is submitted
**Then** the gateway maps the UI Party View to the correct Canton party or demo equivalent
**And** unauthorized party/action combinations are rejected.

**Given** custody state is returned to the UI
**When** holdings or transfer history are refreshed
**Then** ledger-derived data is treated as authoritative
**And** client state stores only UI/demo state such as active Party View, filters, and transient form data.

**Given** the gateway returns lot, transfer, evidence, provenance event, or attestation payloads
**When** the UI consumes the response
**Then** the payloads conform to documented data shapes for revealed and hidden fields
**And** client code does not infer private fields from missing or redacted data.

**Given** a transfer action fails because of insufficient quantity, unauthorized party, invalid evidence, or ledger failure
**When** the UI displays the error
**Then** the user sees a stable, actionable error message
**And** no private details from other parties are exposed.

**Given** the current implementation still uses seeded/local demo state
**When** this story is implemented in MVP mode
**Then** the code clearly separates demo adapters from future Canton-backed gateway boundaries
**And** no story depends on broad client-side custody authority as the long-term source of truth.
