import type { LedgerClient } from "@/lib/ledger/client"

export type LedgerTelemetry = {
  ledgerEndOffset: string
  activeContractCount: number
  partyCount: number
  packageId: string
  ledgerId: string
  ledgerHost: string
}

export type LedgerTelemetryResponse =
  | ({ backend?: never } & LedgerTelemetry)
  | { backend: "demo" }

const MAX_LOG_LINES = 100

export function trimLogLines<T>(lines: T[]): T[] {
  if (lines.length <= MAX_LOG_LINES) return lines
  return lines.slice(lines.length - MAX_LOG_LINES)
}

export function displayLedgerHost(host: string): string {
  return host.replace(/^https?:\/\//, "")
}

export function truncatePackageId(packageId: string): string {
  if (packageId.length <= 16) return packageId
  return `${packageId.slice(0, 8)}…${packageId.slice(-6)}`
}

export function formatLogTimestamp(at: Date): string {
  return at.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function formatOffsetTick(
  from: string,
  to: string,
  at: Date = new Date(),
): string {
  return `${formatLogTimestamp(at)}  offset ${from} → ${to}`
}

export function formatCommandLine(
  choice: string,
  template: string,
  partyHint: string,
  at: Date = new Date(),
): string {
  return `${formatLogTimestamp(at)}  Exercise ${choice} · ${template} · ${partyHint}`
}

export function formatTelemetryHeaderLines(
  telemetry: LedgerTelemetry,
): string[] {
  const host = displayLedgerHost(telemetry.ledgerHost)
  return [
    `canton://${telemetry.ledgerId} @ ${host}`,
    `package commodity-traceability · ${truncatePackageId(telemetry.packageId)}`,
    `parties: ${telemetry.partyCount} · acs: ${telemetry.activeContractCount} · offset: ${telemetry.ledgerEndOffset}`,
    "—",
  ]
}

export async function countActiveContracts(
  client: LedgerClient,
): Promise<number> {
  const offset = await client.getLedgerEndOffset()
  const parties = await client.listParties()
  const contractIds = new Set<string>()

  for (const partyId of parties) {
    const rows = await client.queryActiveContracts(partyId, offset)
    for (const row of rows) {
      const contractId =
        row.contractEntry?.JsActiveContract?.createdEvent?.contractId
      if (contractId) {
        contractIds.add(contractId)
      }
    }
  }

  return contractIds.size
}

export async function fetchLedgerTelemetry(
  client: LedgerClient,
): Promise<LedgerTelemetry> {
  const [ledgerEndOffset, partyCount, activeContractCount] = await Promise.all([
    client.getLedgerEndOffset(),
    client.listParties().then((parties) => parties.length),
    countActiveContracts(client),
  ])

  return {
    ledgerEndOffset,
    activeContractCount,
    partyCount,
    packageId: client.packageId,
    ledgerId: client.ledgerId,
    ledgerHost: client.host,
  }
}
