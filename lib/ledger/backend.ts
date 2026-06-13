export type LedgerBackend = "demo" | "canton"

export function resolveLedgerBackend(): LedgerBackend {
  const value = process.env.LEDGER_BACKEND?.trim().toLowerCase()
  return value === "canton" ? "canton" : "demo"
}

export function isCantonBackend(): boolean {
  return resolveLedgerBackend() === "canton"
}
