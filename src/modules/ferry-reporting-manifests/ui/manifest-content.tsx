"use client"

import { ShipSelectionFlow } from "./ship-selection-flow"
import { useTranslation } from "@/shared/i18n/client"

export function ManifestContent({ ferries, tenantSlug }: { ferries: any[], tenantSlug: string }) {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('admin.manifest.title')}</h1>
                    <p className="text-muted-foreground">{t('admin.manifest.subtitle')}</p>
                </div>
            </div>

            <ShipSelectionFlow ferries={ferries || []} tenantSlug={tenantSlug} />
        </div>
    )
}
