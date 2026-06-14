import { EyeOff, PackageOpen } from "lucide-react"

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
  assets: Asset[]
  accounts: Account[]
  privacyProof?: boolean
}

export function AssetsPanel({
  assets,
  accounts,
  privacyProof = false,
}: AssetsPanelProps) {
  const accountById = (id: string) => accounts.find((account) => account.id === id)

  if (assets.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
        {privacyProof ? (
          <>
            <EyeOff className="mb-3 size-10 text-muted-foreground/60" />
            <p className="font-medium">No private lot positions visible</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              No private contracts are visible to this company. Canton selective
              visibility is working as expected — this is not missing data or a
              loading error.
            </p>
          </>
        ) : (
          <>
            <PackageOpen className="mb-3 size-10 text-muted-foreground/60" />
            <p className="font-medium">No lot positions visible</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              This Party View has no commodity lot positions on the demo custody
              route yet.
            </p>
          </>
        )}
      </div>
    )
  }

  const groups = chunkAssets(assets, GROUP_SIZE)

  return (
    <div className="flex flex-col">
      <div className="space-y-6">
        {groups.map((groupAssets, index) => {
          const holdingAccount = accountById(groupAssets[0]?.accountId ?? "")
          const stageLabel = holdingAccount
            ? STAGE_META[holdingAccount.stageType].label
            : "Lot position"

          return (
            <div
              key={index}
              className="space-y-3 rounded-lg bg-muted-foreground/[0.06] p-1 dark:bg-black/20"
            >
              <p className="px-2.5 pt-2 pb-0 text-sm font-medium text-muted-foreground">
                {stageLabel} {LETTERS[index] ?? index + 1} &middot;{" "}
                {groupAssets.length} lot position
                {groupAssets.length === 1 ? "" : "s"}
              </p>
              <ItemGroup className="gap-0 overflow-hidden rounded-lg bg-background">
                {groupAssets.map((asset) => (
                  <AssetRow key={asset.id} asset={asset} />
                ))}
              </ItemGroup>
            </div>
          )
        })}
      </div>
    </div>
  )
}
