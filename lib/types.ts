import type { LucideIcon } from "lucide-react"
import {
  Anchor,
  Coffee,
  Factory,
  Sprout,
  Truck,
  Warehouse,
} from "lucide-react"

export type CommodityType = "coffee" | "cacao"

export type Certification = "non-gmo" | "deforestation-free"

export type Rating = "A" | "B" | "C"

export type StageType =
  | "production"
  | "truck"
  | "silo"
  | "railway"
  | "origin-port"
  | "ship"
  | "destination-port"

export type Account = {
  id: string
  name: string
  stageType: StageType
  order: number
  location?: string
  operator?: string
}

export type Asset = {
  id: string
  accountId: string
  commodity: CommodityType
  certifications: Certification[]
  rating: Rating
  quantity: number
  unit: "tons"
  originIdentifier?: string
  originEvidence?: OriginEvidenceReference[]
  /**
   * Derived provenance: ids of the source lot position(s) this lot was split
   * from or combined out of. Lets attestation distinguish derived holdings from
   * original origin lots without rewriting prior custody state.
   */
  sourceLotIds?: string[]
}

export type TransferAttachment = {
  id: string
  name: string
  mimeType: string
  size: number
  hash: string
  documentType?: string
  issuer?: string
  timestamp?: string
}

export type TransferStatus = "pending" | "accepted" | "rejected" | "cancelled"

/** Off-ledger origin evidence bound by hash only (MVP demo state). */
export type OriginEvidenceReference = {
  id: string
  name: string
  mimeType: string
  size: number
  hash: string
  documentType?: string
  issuer?: string
  timestamp?: string
}

export type Transfer = {
  id: string
  fromAccountId: string
  toAccountId: string
  assetId?: string
  commodity: CommodityType
  certifications: Certification[]
  rating: Rating
  quantity: number
  unit: "tons"
  status: TransferStatus
  createdAt: string
  occurredAt?: string
  sourceProvenanceRef?: string
  attachments?: TransferAttachment[]
}

export type CommodityMeta = {
  label: string
  color: string
  icon: LucideIcon
}

export type CertificationMeta = {
  label: string
  className: string
}

export type RatingMeta = {
  label: string
  className: string
}

export const COMMODITY_META: Record<CommodityType, CommodityMeta> = {
  coffee: {
    label: "Coffee beans",
    color: "text-amber-800 dark:text-amber-300",
    icon: Coffee,
  },
  cacao: {
    label: "Cacao",
    color: "text-stone-800 dark:text-stone-300",
    icon: Sprout,
  },
}

export const CERTIFICATION_META: Record<Certification, CertificationMeta> = {
  "non-gmo": {
    label: "NON-GMO",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  "deforestation-free": {
    label: "Deforestation-free",
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
}

export const RATING_META: Record<Rating, RatingMeta> = {
  A: {
    label: "A",
    className:
      "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white",
  },
  B: {
    label: "B",
    className:
      "bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950",
  },
  C: {
    label: "C",
    className:
      "bg-rose-600 text-white dark:bg-rose-500 dark:text-white",
  },
}

export const STAGE_META: Record<
  StageType,
  { label: string; icon: LucideIcon }
> = {
  production: { label: "Production site", icon: Sprout },
  truck: { label: "Truck transport", icon: Truck },
  silo: { label: "Silo", icon: Warehouse },
  railway: { label: "Railway transport", icon: Factory },
  "origin-port": { label: "Port terminal", icon: Anchor },
  ship: { label: "Vessel logistics", icon: Anchor },
  "destination-port": { label: "Receiving port terminal", icon: Anchor },
}

export function certificationKey(certifications: Certification[]): string {
  return [...certifications].sort().join("+")
}

export function assetKey(
  commodity: CommodityType,
  certifications: Certification[]
): string {
  return `${commodity}:${certificationKey(certifications)}`
}

const COMMODITY_IMAGE: Record<CommodityType, string> = {
  coffee: "/assets/coffee.png",
  cacao: "/assets/cacao.png",
}

export function assetImage(
  asset: Pick<Asset, "commodity" | "certifications">
): string {
  return COMMODITY_IMAGE[asset.commodity]
}
