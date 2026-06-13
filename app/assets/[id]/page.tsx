import { AssetDetailView } from "@/components/asset-detail-view"

type AssetDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = await params
  return <AssetDetailView assetId={id} />
}
