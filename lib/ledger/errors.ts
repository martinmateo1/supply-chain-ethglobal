/**
 * Stable ledger error codes for the Next.js gateway and lib/ledger layer.
 * User-facing copy is composed in API routes; these codes are for programmatic handling.
 */
export const LedgerErrorCode = {
  LEDGER_COMMAND_FAILED: "LEDGER_COMMAND_FAILED",
  UNAUTHORIZED_PARTY_VIEW: "UNAUTHORIZED_PARTY_VIEW",
  INSUFFICIENT_QUANTITY: "INSUFFICIENT_QUANTITY",
  SOURCE_ASSET_ALREADY_CONSUMED: "SOURCE_ASSET_ALREADY_CONSUMED",
  EVIDENCE_REFERENCE_INVALID: "EVIDENCE_REFERENCE_INVALID",
  ATTESTATION_NOT_AVAILABLE: "ATTESTATION_NOT_AVAILABLE",
  LEDGER_NOT_CONFIGURED: "LEDGER_NOT_CONFIGURED",
} as const

export type LedgerErrorCode =
  (typeof LedgerErrorCode)[keyof typeof LedgerErrorCode]

export class LedgerError extends Error {
  readonly code: LedgerErrorCode
  readonly details?: unknown

  constructor(code: LedgerErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = "LedgerError"
    this.code = code
    this.details = details
  }
}

export function isLedgerError(error: unknown): error is LedgerError {
  return error instanceof LedgerError
}
