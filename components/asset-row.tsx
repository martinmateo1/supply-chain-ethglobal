import Link from "next/link"

import { CommodityThumbnail } from "@/components/commodity-thumbnail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  RATING_META,
  type Asset,
} from "@/lib/types"
import { cn, formatTons } from "@/lib/utils"

type AssetRowProps = {
  asset: Asset
}

export function AssetRow({ asset }: AssetRowProps) {
  const commodity = COMMODITY_META[asset.commodity]
  const rating = RATING_META[asset.rating]

  return (
    <div
      role="listitem"
      className="flex w-full items-center gap-3 border-b-[0.5px] border-border p-4 last:border-b-0"
    >
      <div className="relative mb-[0.3125rem] mr-[0.3125rem] shrink-0">
        <CommodityThumbnail
          commodity={asset.commodity}
          certifications={asset.certifications}
          size={48}
          imageClassName="p-1"
        />
        <Badge
          className={cn(
            "absolute right-0 bottom-0 z-10 size-5 translate-x-1/4 translate-y-1/4 rounded-md border-none p-1 text-xs leading-none font-bold",
            rating.className
          )}
        >
          {rating.label}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 min-w-0 line-clamp-1 text-base leading-snug font-medium">
            {commodity.label}
          </p>
          <p className="m-0 shrink-0 text-base leading-snug font-medium whitespace-nowrap">
            <span className="tabular-nums">{formatTons(asset.quantity)}</span>
            <span className="font-normal text-muted-foreground">
              {" "}
              {asset.unit}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="m-0 flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-snug text-muted-foreground">
            {asset.certifications.length > 0 ? (
              <>
                <span className="text-foreground">Certifications</span>
                <span>
                  {asset.certifications
                    .map((cert) => CERTIFICATION_META[cert].label)
                    .join(" · ")}
                </span>
              </>
            ) : (
              <span>Standard batch</span>
            )}
          </p>
          <Button
            type="button"
            variant="link"
            size="xs"
            className="m-0 h-auto min-h-0 min-w-0 flex-1 justify-end p-0 text-sm leading-snug text-muted-foreground"
            asChild
          >
            <Link href={`/assets/${asset.id}`}>View details</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
