export type ClientLedgerBackend = "demo" | "canton"

let resolvedBackend: ClientLedgerBackend | null = null

export function setClientLedgerBackend(backend: ClientLedgerBackend): void {
  resolvedBackend = backend
}

export function isClientCantonBackend(): boolean {
  if (resolvedBackend) {
    return resolvedBackend === "canton"
  }
  return process.env.NEXT_PUBLIC_LEDGER_BACKEND === "canton"
}
