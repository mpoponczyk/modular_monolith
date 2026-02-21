import { getSalesAnalyticsAction } from "../application/actions"
import { getDictionary, getLocaleFromCookies } from "@/shared/i18n/server"
import { SalesContent } from "./sales-content"

export default async function SalesReportingPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params

    const analyticsData = await getSalesAnalyticsAction(tenantSlug)

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 p-8">
            <h1 className="text-3xl font-bold">Raport Sprzedaży</h1>
            <p className="text-muted-foreground mb-8">Dane analityczne i operacyjne dla wybranego tenanta.</p>
            <SalesContent data={analyticsData} tenantSlug={tenantSlug} />
        </div>
    )
}
