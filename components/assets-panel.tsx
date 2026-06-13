import { PackageOpen } from "lucide-react"

import { AssetRow } from "@/components/asset-row"
import { ItemGroup } from "@/components/ui/item"
import { STAGE_META, type Account, type Asset } from "@/lib/types"

const GROUP_SIZE = 3

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function chunkAssets(assets: Asset[], size: number): Asset[][] {
  const chunks: Asset[][] = []
  for (let i = 0; i < assets.length; i += size) {
    chunks.push(assets.slice(i, i + size))
  }
  return chunks
}

type AssetsPanelProps = {
  account: Account | undefined
  assets: Asset[]
}

export function AssetsPanel({ account, assets }: AssetsPanelProps) {
  if (!account) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Select an account to view its assets
      </div>
    )
  }

  const stageLabel = STAGE_META[account.stageType].label
  const groups = chunkAssets(assets, GROUP_SIZE)

  return (
    <div className="flex flex-col">
      <div>
        {assets.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
            <PackageOpen className="mb-3 size-10 text-muted-foreground/60" />
            <p className="font-medium">No assets in this account</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              This account has no commodity assets yet. Transfers between
              accounts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((groupAssets, index) => (
              <div key={index} className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {stageLabel} {LETTERS[index] ?? index + 1} &middot;{" "}
                  {groupAssets.length} asset{groupAssets.length === 1 ? "" : "s"}
                </p>
                <ItemGroup className="gap-0 overflow-hidden rounded-lg bg-background">
                  {groupAssets.map((asset) => (
                    <AssetRow key={asset.id} asset={asset} />
                  ))}
                </ItemGroup>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
