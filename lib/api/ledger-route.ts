import { NextResponse } from "next/server"

import { apiFailure, apiSuccess } from "@/lib/api/response"
import { isLedgerError } from "@/lib/ledger/errors"

export function ledgerRouteSuccess<T>(data: T, status = 200) {
  return NextResponse.json(apiSuccess(data), { status })
}

export function ledgerRouteError(error: unknown) {
  if (isLedgerError(error)) {
    return NextResponse.json(
      apiFailure(error.code, error.message, error.details),
      { status: error.code === "UNAUTHORIZED_PARTY_VIEW" ? 403 : 400 }
    )
  }

  console.error("Ledger gateway error:", error)
  return NextResponse.json(
    apiFailure(
      "LEDGER_COMMAND_FAILED",
      "Custody action could not be completed. Try again or contact support."
    ),
    { status: 500 }
  )
}
