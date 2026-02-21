import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';
import { getTenantContext } from '@/core/context/getTenantContext';
import { getUserContext } from '@/core/context/getUserContext';
import { SupabaseCalendarService } from '../infrastructure/SupabaseCalendarService';
import { notFound, redirect, forbidden } from 'next/navigation';
import { canAccessModule } from '@/core/rbac';
import { moduleRegistry } from '@/core/moduleRegistry';
import { ShipScheduleCalendar } from './ship-schedule-calendar';
import { subMonths, addMonths, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ params, searchParams }: { params: Promise<{ tenantSlug: string }>, searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const tenantRepo = new SupabaseTenantRepository();
    const { tenantSlug } = await params;
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);

    if (!tenant) notFound();

    const [tenantContext, userContext] = await Promise.all([
        getTenantContext(tenant.id, tenant.slug),
        getUserContext(user.id, tenant.id)
    ]);

    if (!tenantContext || !userContext) forbidden();

    const moduleDef = moduleRegistry.getModule('ferry-planning-calendar');
    if (!moduleDef) notFound();

    if (!canAccessModule(moduleDef, userContext!)) forbidden();

    // Data Fetching
    const service = new SupabaseCalendarService();

    // Fetch a wide enough range for typical calendar navigation caching 
    const now = new Date();
    const startDate = format(subMonths(now, 3), 'yyyy-MM-dd');
    const endDate = format(addMonths(now, 6), 'yyyy-MM-dd');

    const [trips, ferries, routes, operationalStatuses] = await Promise.all([
        service.getTripsForRange(tenant.id, startDate, endDate),
        service.getFerries(tenant.id),
        service.getRoutes(tenant.id),
        service.getOperationalStatuses(tenant.id, startDate, endDate)
    ]);

    const resolvedSearchParams = await searchParams;
    const initialDate = resolvedSearchParams.date ? new Date(resolvedSearchParams.date) : new Date();
    const calView = resolvedSearchParams.view as 'month' | 'week' | 'day' | undefined;

    return (
        <div className="p-4 md:p-6 h-full w-full max-w-none">
            <ShipScheduleCalendar
                ferries={ferries}
                trips={trips}
                operationalStatuses={operationalStatuses}
                routes={routes}
                templates={[]}
                sellers={[]}
                heatmapConfig={[]}
                initialDate={initialDate}
                initialView={calView}
            />
        </div>
    );
}
