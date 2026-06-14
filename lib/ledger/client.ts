import { LedgerError, LedgerErrorCode, mapCantonError } from "@/lib/ledger/errors"

export type LedgerClientConfig = {
  host?: string
  ledgerId?: string
  packageId?: string
}

type JsCommands = {
  commands: unknown[]
  commandId: string
  actAs: string[]
  readAs?: string[]
  userId?: string
}

type ActiveContractRow = {
  contractEntry?: {
    JsActiveContract?: {
      createdEvent?: {
        contractId?: string
        templateId?: string
        createArgument?: Record<string, unknown>
        createdAt?: string
      }
    }
  }
}

type TransactionResponse = {
  transaction?: {
    effectiveAt?: string
    events?: Array<{
      CreatedEvent?: {
        contractId?: string
        templateId?: string
        createArgument?: Record<string, unknown>
      }
      ArchivedEvent?: {
        contractId?: string
        templateId?: string
        choice?: string
      }
    }>
  }
}

export type LedgerClient = {
  host: string
  ledgerId: string
  packageId: string
  listParties: () => Promise<string[]>
  findPartyByHint: (hint: string) => Promise<string | null>
  getLedgerEndOffset: () => Promise<string>
  queryActiveContracts: (
    partyId: string,
    offset?: string,
  ) => Promise<ActiveContractRow[]>
  queryUpdateFlats: (
    partyId: string,
    beginExclusive?: string,
    endInclusive?: string,
  ) => Promise<unknown[]>
  submitAndWaitForTransaction: (
    actAs: string[],
    readAs: string[],
    commands: unknown[],
    commandId: string,
  ) => Promise<TransactionResponse>
}

function templateId(client: LedgerClient, entity: string): string {
  return `${client.packageId}:Commodity.LotPosition:${entity}`
}

export function lotPositionTemplateId(client: LedgerClient): string {
  return templateId(client, "LotPosition")
}

export function custodyTransferTemplateId(client: LedgerClient): string {
  return templateId(client, "CustodyTransfer")
}

export function createLedgerClient(config: LedgerClientConfig = {}): LedgerClient {
  const host = (config.host ?? process.env.CANTON_LEDGER_HOST)?.replace(/\/$/, "")
  const ledgerId = config.ledgerId ?? process.env.CANTON_LEDGER_ID
  const packageId = config.packageId ?? process.env.CANTON_PACKAGE_ID

  if (!host || !ledgerId) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "Canton ledger is not configured. Set CANTON_LEDGER_HOST and CANTON_LEDGER_ID.",
      { host: Boolean(host), ledgerId: Boolean(ledgerId) },
    )
  }

  if (!packageId) {
    throw new LedgerError(
      LedgerErrorCode.LEDGER_NOT_CONFIGURED,
      "Canton package id is not configured. Set CANTON_PACKAGE_ID after uploading the DAR.",
    )
  }

  async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${host}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      })
    } catch (error) {
      throw new LedgerError(
        LedgerErrorCode.LEDGER_COMMAND_FAILED,
        "Canton ledger is unavailable.",
        error,
      )
    }

    const text = await response.text()
    if (!response.ok) {
      throw mapCantonError(text, response.status)
    }

    if (!text) {
      return {} as T
    }

    try {
      return JSON.parse(text) as T
    } catch {
      throw new LedgerError(
        LedgerErrorCode.LEDGER_COMMAND_FAILED,
        "Canton ledger returned an invalid response.",
        text,
      )
    }
  }

  const client: LedgerClient = {
    host,
    ledgerId,
    packageId,

    async listParties() {
      const payload = await jsonFetch<{
        partyDetails?: Array<{ party?: string }>
      }>("/v2/parties")
      return (payload.partyDetails ?? [])
        .map((entry) => entry.party)
        .filter((party): party is string => Boolean(party))
    },

    async findPartyByHint(hint) {
      const parties = await client.listParties()
      return parties.find((party) => party.startsWith(`${hint}::`)) ?? null
    },

    async getLedgerEndOffset() {
      const payload = await jsonFetch<{ offset?: number | string }>(
        "/v2/state/ledger-end",
      )
      if (payload.offset === undefined || payload.offset === null) {
        throw new LedgerError(
          LedgerErrorCode.LEDGER_COMMAND_FAILED,
          "Canton ledger did not return a current offset.",
        )
      }
      return String(payload.offset)
    },

    async queryActiveContracts(partyId, offset) {
      const activeAtOffset = offset ?? (await client.getLedgerEndOffset())
      return jsonFetch<ActiveContractRow[]>("/v2/state/active-contracts", {
        method: "POST",
        body: JSON.stringify({
          filter: {
            filtersByParty: {
              [partyId]: {
                cumulative: [
                  {
                    identifierFilter: {
                      WildcardFilter: {
                        value: { includeCreatedEventBlob: false },
                      },
                    },
                  },
                ],
              },
            },
          },
          verbose: true,
          activeAtOffset,
        }),
      })
    },

    async queryUpdateFlats(partyId, beginExclusive = "0", endInclusive) {
      const end = endInclusive ?? (await client.getLedgerEndOffset())
      const payload = await jsonFetch<unknown[]>("/v2/updates/flats", {
        method: "POST",
        body: JSON.stringify({
          beginExclusive,
          endInclusive: end,
          verbose: true,
          filter: {
            filtersByParty: {
              [partyId]: {
                cumulative: [
                  {
                    identifierFilter: {
                      WildcardFilter: {
                        value: { includeCreatedEventBlob: false },
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
      })
      return Array.isArray(payload) ? payload : []
    },

    async submitAndWaitForTransaction(actAs, readAs, commands, commandId) {
      const body: { commands: JsCommands } = {
        commands: {
          commands,
          commandId,
          actAs,
          readAs,
          userId: "hackaton-gateway",
        },
      }

      return jsonFetch<TransactionResponse>(
        "/v2/commands/submit-and-wait-for-transaction",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      )
    },
  }

  return client
}
