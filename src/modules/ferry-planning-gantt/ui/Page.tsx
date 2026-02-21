import { createAuthClient } from "@/infra/supabase/server-auth";
import { SupabaseTenantRepository } from "@/infra/repositories/SupabaseTenantRepository";
import { SupabaseCalendarService } from '../infrastructure/SupabaseCalendarService';
import { notFound, redirect } from "next/navigation";
import { getUserContext } from "@/core/context/getUserContext";
import { getTenantContext } from "@/core/context/getTenantContext";
import { ShipsGantt } from "./ships-gantt";

interface PageProps {
    params: Promise<{
        tenantSlug: string;
    }>;
}

export default async function GanttPage({ params }: PageProps) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { tenantSlug } = await params;
    const tenantRepo = new SupabaseTenantRepository();
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);

    if (!tenant) notFound();

    // Context & RBAC
    const [tenantContext, userContext] = await Promise.all([
        getTenantContext(tenant.id, tenant.slug),
        getUserContext(user.id, tenant.id)
    ]);

    if (!tenantContext || !userContext) redirect('/login');

    if (userContext.permissions && !userContext.permissions.includes('planning.view') && !userContext.permissions.includes('*')) {
        redirect('/admin/unauthorized');
    }

    // Fetch Gantt Data (Next 7 days by default)
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // +7 Days

    // We can use SupabaseCalendarService as it exists in the same domain's infrastructure
    // and correctly implements the required data fetchings
    const service = new SupabaseCalendarService();

    // Fetch dependencies
    const trips = await service.getTripsForRange(tenant.id, startDate.toISOString(), endDate.toISOString());
    const ferries = await service.getFerries(tenant.id);
    const routes = await service.getRoutes(tenant.id);

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-4">Trips Gantt Chart</h1>
            <div className="flex-1">
                <ShipsGantt
                    trips={trips}
                    ferries={ferries}
                    routes={routes}
                    partners={[]}
                    heatmapConfig={[]}
                    initialDate={startDate}
                />
            </div>
        </div>
    );
}
