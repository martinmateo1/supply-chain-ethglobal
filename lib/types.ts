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
}

export type TransferAttachment = {
  id: string
  name: string
  mimeType: string
  size: number
  hash: string
}

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
  occurredAt: string
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
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  B: {
    label: "B",
    className:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  C: {
    label: "C",
    className:
      "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
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

export const ASSET_IMAGES: Record<string, string> = {
  [assetKey("coffee", ["non-gmo", "deforestation-free"])]:
    "/assets/green.png",
  [assetKey("coffee", ["non-gmo"])]: "/assets/blue.png",
  [assetKey("cacao", ["deforestation-free"])]: "/assets/red.png",
  [assetKey("cacao", ["non-gmo", "deforestation-free"])]:
    "/assets/purple.png",
}

const COMMODITY_DEFAULT_IMAGE: Record<CommodityType, string> = {
  coffee: "/assets/green.png",
  cacao: "/assets/orange.png",
}

export function assetImage(
  asset: Pick<Asset, "commodity" | "certifications">
): string {
  return (
    ASSET_IMAGES[assetKey(asset.commodity, asset.certifications)] ??
    COMMODITY_DEFAULT_IMAGE[asset.commodity]
  )
}
