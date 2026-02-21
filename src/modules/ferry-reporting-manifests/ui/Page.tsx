import { getManifestFerriesAction } from "../application/actions"
import { ManifestContent } from "./manifest-content"

export default async function ManifestReportsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params
    const ferries = await getManifestFerriesAction(tenantSlug)

    return (
        <ManifestContent ferries={ferries || []} tenantSlug={tenantSlug} />
    )
}
