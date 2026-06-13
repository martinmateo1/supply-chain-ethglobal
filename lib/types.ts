import type { LucideIcon } from "lucide-react"
import {
  Anchor,
  Factory,
  Sprout,
  Truck,
  Warehouse,
  Wheat,
} from "lucide-react"

export type CommodityType = "soybean" | "wheat" | "corn"

export type Certification = "non-gmo" | "deforestation-free"

export type Rating = "A" | "B" | "C"

export type StageType =
  | "campo"
  | "transporte"
  | "silo"
  | "puerto"
  | "planta"

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
}

export type Transfer = {
  id: string
  fromAccountId: string
  toAccountId: string
  commodity: CommodityType
  certifications: Certification[]
  rating: Rating
  quantity: number
  unit: "tons"
  occurredAt: string
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
  soybean: {
    label: "Soybean",
    color: "text-amber-700 dark:text-amber-400",
    icon: Sprout,
  },
  wheat: {
    label: "Wheat",
    color: "text-yellow-700 dark:text-yellow-400",
    icon: Wheat,
  },
  corn: {
    label: "Corn",
    color: "text-orange-700 dark:text-orange-400",
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
  campo: { label: "Field", icon: Sprout },
  transporte: { label: "Transport", icon: Truck },
  silo: { label: "Silo", icon: Warehouse },
  puerto: { label: "Port", icon: Anchor },
  planta: { label: "Processing plant", icon: Factory },
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
  [assetKey("soybean", ["non-gmo", "deforestation-free"])]:
    "/assets/green.png",
  [assetKey("corn", ["non-gmo"])]: "/assets/orange.png",
  [assetKey("soybean", ["non-gmo"])]: "/assets/blue.png",
  [assetKey("wheat", ["deforestation-free"])]: "/assets/red.png",
  [assetKey("corn", ["non-gmo", "deforestation-free"])]:
    "/assets/purple.png",
}

const COMMODITY_DEFAULT_IMAGE: Record<CommodityType, string> = {
  soybean: "/assets/green.png",
  wheat: "/assets/red.png",
  corn: "/assets/orange.png",
}

export function assetImage(
  asset: Pick<Asset, "commodity" | "certifications">
): string {
  return (
    ASSET_IMAGES[assetKey(asset.commodity, asset.certifications)] ??
    COMMODITY_DEFAULT_IMAGE[asset.commodity]
  )
}
