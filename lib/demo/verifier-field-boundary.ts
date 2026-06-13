/**
 * Boundary for Epic 4 attestation / verifier work.
 *
 * Verifier Party Views may only surface fields explicitly shared in an
 * attestation proof — never custody-route holdings, transfer history,
 * evidence attachments, or counterparty identities from private contracts.
 *
 * Dashboard panels for verifier and non-involved views must stay empty;
 * do not backfill hidden quantities into totals, counters, or empty-state copy.
 */
export const VERIFIER_SHARED_FIELD_KEYS = [
  "attestationId",
  "commodityType",
  "originRegion",
  "certificationLabels",
  "chainIntegrityHash",
  "issuedAt",
] as const

export type VerifierSharedFieldKey = (typeof VERIFIER_SHARED_FIELD_KEYS)[number]

export function isVerifierSharedField(key: string): key is VerifierSharedFieldKey {
  return (VERIFIER_SHARED_FIELD_KEYS as readonly string[]).includes(key)
}
