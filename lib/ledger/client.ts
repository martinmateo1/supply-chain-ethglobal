import { LedgerError, LedgerErrorCode } from "@/lib/ledger/errors"

export type LedgerClientConfig = {
  /** Canton ledger API host, e.g. http://localhost:6865 */
  host?: string
  /** Ledger id or package id once LocalNet/DevNet is wired */
  ledgerId?: string
}

/**
 * Low-level Canton/ledger client setup.
 * TODO (Epic 2): connect to Canton JSON API or chosen ledger driver.
 */
export function createLedgerClient(config: LedgerClientConfig = {}) {
  const host = config.host ?? process.env.CANTON_LEDGER_HOST
  const ledgerId = config.ledgerId ?? process.env.CANTON_LEDGER_ID

  if (!host || !ledgerId) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "Canton ledger is not configured. Set CANTON_LEDGER_HOST and CANTON_LEDGER_ID.",
      { host: Boolean(host), ledgerId: Boolean(ledgerId) },
    )
  }

  return { host, ledgerId }
}

export type LedgerClient = ReturnType<typeof createLedgerClient>
