"use client"

import Image from "next/image"
import { useState } from "react"

import {
  COMMODITY_META,
  assetImage,
  type Asset,
  type CommodityType,
  type Certification,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type CommodityThumbnailProps = {
  commodity: CommodityType
  certifications: Certification[]
  size?: number
  className?: string
  imageClassName?: string
}

export function CommodityThumbnail({
  commodity,
  certifications,
  size = 48,
  className,
  imageClassName,
}: CommodityThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const meta = COMMODITY_META[commodity]
  const Icon = meta.icon
  const assetLike: Pick<Asset, "commodity" | "certifications"> = {
    commodity,
    certifications,
  }

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted",
          className
        )}
        style={{ width: size, height: size }}
      >
        <Icon
          className={cn("text-muted-foreground", meta.color)}
          style={{ width: Math.round(size * 0.45), height: Math.round(size * 0.45) }}
          aria-hidden
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-muted",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={assetImage(assetLike)}
        alt={meta.label}
        width={size}
        height={size}
        className={cn("size-full object-cover", imageClassName)}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
