---
title: "Private Commodity Traceability on Canton"
status: "draft"
created: "2026-06-12"
updated: "2026-06-12"
---

# Product Brief: Private Commodity Traceability on Canton

## Executive Summary

Private Commodity Traceability on Canton is a hackathon MVP for tracking the physical custody of certified commodities across a private multi-company supply chain. The app should support a commodity selector so the same custody model can be used for different products. For the demo, coffee beans and cacao are seeded examples that move from production sites, through truck transport, into collection or export storage, through a bulk transport leg, and finally into port storage for export. Each operational node acts like a wallet or Canton party that holds quantities and records inbound and outbound movements.

The product is built around a real supply-chain tension: every participant needs traceability, but no company wants to expose its inventory, storage locations, suppliers, customers, or transfer history to competitors. Canton is the core technology because the product needs party-level privacy, not a public shared ledger where everyone can inspect the whole graph.

The MVP focuses only on physical custody. Commercial ownership, financing, payments, and invoice settlement are out of scope. Transportation sheets, receipts, invoices, and related documents can be attached to custody transfers as proof artifacts, with the MVP storing document metadata and hashes rather than treating documents as financial instruments.

## The Problem

Bulk agricultural supply chains are traceable on paper, but the data is fragmented across farms, trucking companies, storage operators, exporters, and port terminals. A single production batch can be split across many trucks, mixed with compatible inventory in storage, split again for outbound transport, and finally aggregated at a port. Reconstructing provenance after the fact is slow and depends on documents passed between companies.

The obvious blockchain answer, a public ledger of every transfer and balance, does not fit the business reality. Companies do not want their stock levels, counterparties, supplier mix, routes, or port positions visible to the whole network. A useful traceability system has to prove custody history without turning private operational data into market intelligence.

## The Solution

The app models each operational node as a private ledger participant and keeps commodity type as configurable product metadata:

- Production sites create original commodity lots with selected product type, quantity, origin, and certifications.
- Transport wallets receive custody of quantities from an origin and deliver them to a destination with attached transport-sheet evidence.
- Storage wallets receive, hold, combine, split, and send quantities while preserving provenance links.
- Port storage wallets receive final inbound quantities and can issue an export-ready custody-chain attestation.

The user experience is a web dashboard where a user acts as a selected company party and sees only the data that party is entitled to see. The demo should switch between a producer, logistics company, storage operator, and port operator to show that the same supply-chain flow exists on the ledger, but each party's view is limited.

## Canton Fit

This project should target the Canton Foundation prize as a Daml-native privacy application. The value is not "supply chain on blockchain" in the abstract; the value is that Canton can represent private bilateral and multi-party custody events where only signatories, controllers, and selected observers see the relevant contracts.

The Daml model should keep authorization and visibility narrow. Current custodians and transfer counterparties should authorize the contracts and choices that represent their real-world responsibilities. Auditors, buyers, or regulators should be observers only when they are meant to receive selective visibility. Broad observers or overly shared proof contracts would weaken the privacy story.

The strongest Canton demo is a party-perspective walkthrough:

- The producer sees created lots, outbound truck transfers, and its own origin/certification data.
- The logistics company sees assigned transport legs and document evidence for its movements, but not unrelated storage balances.
- The storage operator sees inbound deliveries, stored quantities, and outbound movements from its own warehouse or storage site.
- The port operator sees inbound arrivals and can request or generate a traceability attestation for a shipped quantity.
- A non-involved company sees none of the private contracts.
- A custody transfer archives the previous custody position and creates the new one atomically, with document hashes or proof references bound to that transfer.

## MVP Storyline

[ASSUMPTION] The MVP supports a generic commodity selector. Coffee beans and cacao are the seeded demo examples because they follow a similar custody pattern to bulk agricultural exports while making origin, certification, quality, and provenance especially visible to buyers.

The demo journey:

1. Farms or production sites choose a commodity type and create certified lots with origin coordinates, establishment metadata, quality grade, and certification metadata. The demo uses coffee beans and cacao as examples.
2. The lot is split into three truck loads, each with a transport sheet, quantity, origin, destination, and document hash.
3. The storage operator receives the trucks and stores the quantities, optionally combining compatible lots from approved origins.
4. The storage operator sends an outbound quantity by bulk transport to a port storage wallet.
5. The port receives the shipment and generates a custody-chain attestation proving the chain of custody, quantities, involved parties, certifications, and supporting document hashes.

## Attestation

The MVP attestation proves the full custody chain for a selected quantity. It should include:

- Product and quantity.
- Origin site metadata, including coordinates or establishment identifier.
- Certification claims attached at origin and preserved through movements.
- Custody path from origin through transport, storage, outbound transport, and port storage.
- Split and merge references sufficient to explain how the final quantity relates to prior lots.
- Document hashes and metadata for transportation sheets, receipts, and invoices attached to transfers.
- Issuer, recipient, timestamp, and verification status.

[ASSUMPTION] The attestation can be offchain for the hackathon MVP, with a verifiable hash or identifier anchored to Canton-visible state. Full public verification or EAS compatibility can be a later extension.

Evidence should stay off-ledger in the MVP. The ledger should bind hashes, content identifiers, credential identifiers, or signed JSON references to custody events, while access to the actual files can remain in Supabase or another document store.

## Users

Primary users:

- Producers that need to originate certified commodity lots and prove origin.
- Logistics operators that need to record transport custody without exposing routes or customer volume broadly.
- Storage operators that need to manage inbound, combined, split, and outbound inventory.
- Exporters or port operators that need export-ready provenance evidence.

Secondary users:

- Buyers, auditors, or regulators who receive a selective traceability attestation rather than full ledger access.

## Scope

In scope for the hackathon MVP:

- Canton/Daml contracts for lot creation, custody transfer, split, merge/combine, storage, and attestation issuance.
- React dashboard adapted from the existing mockup.
- Commodity selector with coffee beans and cacao as demo seed data, while keeping the data model generic.
- Party switcher for demoing privacy by company perspective.
- Minimal TypeScript backend only where needed for frontend integration, document metadata, or API orchestration.
- Supabase only if needed for non-ledger data such as document metadata, file references, and app convenience state.
- Document attachments represented as metadata plus hashes.

Out of scope for the MVP:

- Payments, financing, invoice settlement, lending, or warehouse receipt finance.
- Real GPS tracking or IoT integration.
- Complex compliance rules for every commodity type.
- Fully general arbitrary graph provenance.
- Public marketplace or buyer discovery.
- Privy integration unless it is quick and directly improves login, onboarding, or wallet custody UX.
- Perfect document verification, IoT-grade evidence, or a full verifiable credential stack.

## Success Criteria

The hackathon submission is successful if it can show:

- A working Canton DevNet deployment with meaningful Daml contracts.
- A UI that records and displays the custody movement of a commodity lot.
- Split and merge behavior across transport and storage.
- Attached document proof metadata on transfers.
- A generated custody-chain attestation.
- Clear privacy differences when switching between company perspectives.
- A README explaining setup, architecture, privacy model, known limitations, and demo script.

## Optional Privy Fit

Privy is optional. It should only be included if it helps the app feel credible without distracting from Canton. The most plausible use is user onboarding or embedded wallet/account UX for company operators. A Privy prize attempt should not be assumed unless the team intentionally adds a qualifying Privy capability.

## Vision

If the MVP works, the longer-term product becomes a private provenance layer for commodity supply chains. Companies can exchange custody proofs without exposing their entire operating graph, and buyers or auditors can verify selected claims about origin, certification, custody, and supporting documents. Over time this can expand from physical traceability into tokenized warehouse receipts, trade finance, insurance, and compliance workflows, but only after the core custody model is proven.
