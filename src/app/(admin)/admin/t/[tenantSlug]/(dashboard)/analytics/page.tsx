
import { createAuthClient } from "@/infra/supabase/server-auth";
import { SupabaseTenantRepository } from "@/infra/repositories/SupabaseTenantRepository";
import { notFound, redirect } from "next/navigation";
import { getUserContext } from "@/core/context/getUserContext";
import { getTenantContext } from "@/core/context/getTenantContext";
import { SupabaseSalesService } from "@/modules/ferry-reporting-sales/infrastructure/SupabaseSalesService";

interface PageProps {
    params: Promise<{
        tenantSlug: string;
    }>;
}

export default async function AnalyticsPage({ params }: PageProps) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { tenantSlug } = await params;
    const tenantRepo = new SupabaseTenantRepository();
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);

    if (!tenant) notFound();

    const [tenantContext, userContext] = await Promise.all([
        getTenantContext(tenant.id, tenant.slug),
        getUserContext(user.id, tenant.id)
    ]);

    if (!tenantContext || !userContext) redirect('/login');

    if (!userContext.permissions.includes('analytics.view') && !userContext.permissions.includes('*')) {
        redirect('/admin/unauthorized');
    }

    const salesService = new SupabaseSalesService();
    const metrics = await salesService.getDashboardMetrics(tenant.id);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Sales Analytics</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                    <div className="text-gray-500 text-sm font-medium uppercase">Total Revenue</div>
                    <div className="text-3xl font-bold mt-2">{metrics.currency} {metrics.totalRevenue.toLocaleString()}</div>
                    <div className="text-green-500 text-sm mt-1">+12% vs last month</div>
                </div>
                <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
                    <div className="text-gray-500 text-sm font-medium uppercase">Total Orders</div>
                    <div className="text-3xl font-bold mt-2">{metrics.totalOrders}</div>
                </div>
                <div className="bg-white p-6 rounded shadow border-l-4 border-purple-500">
                    <div className="text-gray-500 text-sm font-medium uppercase">Avg. Occupancy</div>
                    <div className="text-3xl font-bold mt-2">{metrics.occupancyRate}%</div>
                </div>
                <div className="bg-white p-6 rounded shadow border-l-4 border-orange-500">
                    <div className="text-gray-500 text-sm font-medium uppercase">Cancellations</div>
                    <div className="text-3xl font-bold mt-2">{metrics.cancellationRate}%</div>
                </div>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow h-96 flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400">Revenue Trend Chart (Coming Soon)</span>
                </div>
                <div className="bg-white p-6 rounded shadow h-96 flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400">Route Popularity Pie Chart (Coming Soon)</span>
                </div>
            </div>
        </div>
    );
}
