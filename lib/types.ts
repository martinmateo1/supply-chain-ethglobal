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

export type Holding = {
  id: string
  accountId: string
  commodity: CommodityType
  certifications: Certification[]
  quantity: number
  unit: "tons"
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

export const STAGE_META: Record<
  StageType,
  { label: string; icon: LucideIcon }
> = {
  campo: { label: "Campo", icon: Sprout },
  transporte: { label: "Transporte", icon: Truck },
  silo: { label: "Silo", icon: Warehouse },
  puerto: { label: "Puerto", icon: Anchor },
  planta: { label: "Planta de procesamiento", icon: Factory },
}

export function certificationKey(certifications: Certification[]): string {
  return [...certifications].sort().join("+")
}

export function holdingKey(
  commodity: CommodityType,
  certifications: Certification[]
): string {
  return `${commodity}:${certificationKey(certifications)}`
}
