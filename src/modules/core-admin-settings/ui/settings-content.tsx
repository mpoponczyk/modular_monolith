"use client"

import { SettingsUI } from "./settings-ui"
import { LayoutGrid } from "lucide-react"
import Link from "next/link"

import { HeatmapThreshold } from "../domain/heatmap-config"

interface SettingsContentProps {
    tenantSlug: string
    initialEmailEnabled: boolean
    initialTimezone: string
    initialHeatmapConfig: HeatmapThreshold[]
    profile: any
}

export function SettingsContent({ tenantSlug, initialEmailEnabled, initialTimezone, initialHeatmapConfig, profile }: SettingsContentProps) {
    const t = (key: string, defVal?: string) => defVal || key

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link href={`/admin/t/${tenantSlug}/dashboard`} className="hover:text-blue-600 transition-colors">Admin</Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">{t('admin.settingsPage.breadcrumb', 'Settings')}</span>
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('admin.settingsPage.title')}</h1>
            </div>

            <SettingsUI
                tenantSlug={tenantSlug}
                initialEmailEnabled={initialEmailEnabled}
                initialTimezone={initialTimezone}
                initialHeatmapConfig={initialHeatmapConfig}
            />
        </div>
    )
}
