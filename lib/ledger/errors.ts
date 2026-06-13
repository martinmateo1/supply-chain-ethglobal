/**
 * Stable ledger error codes for the Next.js gateway and lib/ledger layer.
 */
export const LedgerErrorCode = {
  LEDGER_COMMAND_FAILED: "LEDGER_COMMAND_FAILED",
  UNAUTHORIZED_PARTY_VIEW: "UNAUTHORIZED_PARTY_VIEW",
  INSUFFICIENT_QUANTITY: "INSUFFICIENT_QUANTITY",
  SOURCE_ASSET_ALREADY_CONSUMED: "SOURCE_ASSET_ALREADY_CONSUMED",
  EVIDENCE_REFERENCE_INVALID: "EVIDENCE_REFERENCE_INVALID",
  ATTESTATION_NOT_AVAILABLE: "ATTESTATION_NOT_AVAILABLE",
  LEDGER_NOT_CONFIGURED: "LEDGER_NOT_CONFIGURED",
  LEDGER_CONTENTION: "LEDGER_CONTENTION",
  LEDGER_UNAVAILABLE: "LEDGER_UNAVAILABLE",
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

export function mapCantonError(body: string, status: number): LedgerError {
  // Normalize so structured Canton error codes (CONTRACT_NOT_FOUND) and prose
  // ("contract not found") are both matched by the same substring checks.
  const lower = body.toLowerCase().replace(/_/g, " ")

  if (status === 503 || lower.includes("unavailable")) {
    return new LedgerError(
      LedgerErrorCode.LEDGER_UNAVAILABLE,
      "Canton ledger is temporarily unavailable.",
    )
  }

  if (
    lower.includes("contention") ||
    lower.includes("concurrent") ||
    lower.includes("locked contracts")
  ) {
    return new LedgerError(
      LedgerErrorCode.LEDGER_CONTENTION,
      "The ledger rejected this command due to contention. Retry the custody action.",
    )
  }

  if (
    lower.includes("insufficient quantity") ||
    lower.includes("transfer amount must be positive")
  ) {
    return new LedgerError(
      LedgerErrorCode.INSUFFICIENT_QUANTITY,
      "Transfer quantity cannot exceed the available quantity in the source lot position.",
    )
  }

  if (
    lower.includes("contract not found") ||
    lower.includes("could not find contract") ||
    lower.includes("already consumed")
  ) {
    return new LedgerError(
      LedgerErrorCode.SOURCE_ASSET_ALREADY_CONSUMED,
      "This lot position is no longer available for transfer.",
    )
  }

  if (
    lower.includes("unauthorized") ||
    lower.includes("permission denied") ||
    lower.includes("requires authorizers")
  ) {
    return new LedgerError(
      LedgerErrorCode.UNAUTHORIZED_PARTY_VIEW,
      "This Party View is not authorized to perform that custody action.",
    )
  }

  return new LedgerError(
    LedgerErrorCode.LEDGER_COMMAND_FAILED,
    "Custody action could not be completed on the ledger.",
    body.slice(0, 500),
  )
}
