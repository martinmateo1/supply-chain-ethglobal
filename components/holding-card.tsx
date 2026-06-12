import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  type Holding,
} from "@/lib/types"

type HoldingCardProps = {
  holding: Holding
}

export function HoldingCard({ holding }: HoldingCardProps) {
  const commodity = COMMODITY_META[holding.commodity]
  const CommodityIcon = commodity.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <CommodityIcon className={`size-4 ${commodity.color}`} />
            </div>
            <div>
              <CardTitle className="text-base">{commodity.label}</CardTitle>
              <CardDescription>
                {holding.certifications.length > 0
                  ? "Certified batch"
                  : "Standard batch"}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums">
              {holding.quantity}
            </p>
            <p className="text-xs text-muted-foreground">{holding.unit}</p>
          </div>
        </div>
      </CardHeader>
      {holding.certifications.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5">
            {holding.certifications.map((cert) => (
              <Badge
                key={cert}
                variant="outline"
                className={CERTIFICATION_META[cert].className}
              >
                {CERTIFICATION_META[cert].label}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
