import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { TransferAttachment } from "@/lib/types"

export type StoredEvidenceMetadata = {
  name: string
  mimeType: string
  size: number
  documentType?: string
  issuer?: string
  timestamp?: string
}

const STORE_DIR = path.join(process.cwd(), ".data")
const STORE_PATH = path.join(STORE_DIR, "evidence-metadata.json")

async function readStore(): Promise<Record<string, StoredEvidenceMetadata>> {
  try {
    const raw = await readFile(STORE_PATH, "utf8")
    return JSON.parse(raw) as Record<string, StoredEvidenceMetadata>
  } catch {
    return {}
  }
}

async function writeStore(
  store: Record<string, StoredEvidenceMetadata>,
): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8")
}

export async function registerEvidenceMetadata(
  attachments: TransferAttachment[] | undefined,
): Promise<void> {
  if (!attachments?.length) return

  const store = await readStore()
  let changed = false

  for (const attachment of attachments) {
    const hash = attachment.hash?.trim()
    if (!hash) continue
    store[hash] = {
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      ...(attachment.documentType
        ? { documentType: attachment.documentType }
        : {}),
      ...(attachment.issuer ? { issuer: attachment.issuer } : {}),
      ...(attachment.timestamp ? { timestamp: attachment.timestamp } : {}),
    }
    changed = true
  }

  if (changed) {
    await writeStore(store)
  }
}

export async function resolveEvidenceMetadata(
  hash: string,
): Promise<StoredEvidenceMetadata | null> {
  const store = await readStore()
  return store[hash.trim()] ?? null
}

export function resolveEvidenceMetadataSync(
  hash: string,
  store: Record<string, StoredEvidenceMetadata>,
): StoredEvidenceMetadata | null {
  return store[hash.trim()] ?? null
}

export async function loadEvidenceMetadataStore(): Promise<
  Record<string, StoredEvidenceMetadata>
> {
  return readStore()
}
