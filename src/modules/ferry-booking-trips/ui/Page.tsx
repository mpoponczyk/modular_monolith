import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';
import { getTenantContext } from '@/core/context/getTenantContext';
import { getUserContext } from '@/core/context/getUserContext';
import { SupabaseTripRepository } from '../infrastructure/SupabaseTripRepository';
import { SupabaseFerryRepository } from '../infrastructure/SupabaseFerryRepository';
import { SupabaseFerryRouteRepository } from '../infrastructure/SupabaseFerryRouteRepository';
import { notFound, redirect, forbidden } from 'next/navigation';
import { canAccessModule } from '@/core/rbac';
import { moduleRegistry } from '@/core/moduleRegistry';
import { TripsContent } from './trips-content';

// Force dynamic rendering as we depend on cookies/auth
export const dynamic = 'force-dynamic';

export default async function TripsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    // 1. Auth Check
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 2. Tenant Resolution
    const tenantRepo = new SupabaseTenantRepository();
    const { tenantSlug } = await params;
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);

    if (!tenant) {
        notFound();
    }

    // 3. Resolve Contexts
    const [tenantContext, userContext] = await Promise.all([
        getTenantContext(tenant.id, tenant.slug),
        getUserContext(user.id, tenant.id)
    ]);

    if (!tenantContext || !userContext) {
        forbidden();
    }

    // 4. Module Access Check
    // We check the specific sub-module for Trips
    const moduleDef = moduleRegistry.getModule('ferry-booking-trips');
    if (!moduleDef) {
        console.error("Module 'ferry-booking-trips' not found in registry");
        notFound();
    }

    if (!canAccessModule(moduleDef, userContext!)) {
        forbidden();
    }

    // 5. Granular Feature Permission Check
    const hasPermission = userContext!.permissions.includes('trips.view') || userContext!.permissions.includes('*');
    if (!hasPermission) {
        forbidden();
    }

    // 6. Data Fetch (Strict Repository Pattern)
    const tripRepo = new SupabaseTripRepository();
    const ferryRepo = new SupabaseFerryRepository(supabase, tenant.id);
    const routeRepo = new SupabaseFerryRouteRepository();

    const trips = await tripRepo.findAll(tenant.id);
    const ferries = await ferryRepo.listFerries();
    const routes = await routeRepo.findAll(tenant.id);

    // Provide mocked empty arrays for non-essential or yet-to-be-migrated dependencies (Partners/Templates)
    // heatmapConfig defaults to [] inside the component logic.
    return (
        <TripsContent
            trips={trips}
            routes={routes}
            ferries={ferries}
            partners={[]}
            operationalStatuses={[]}
            templates={[]}
            heatmapConfig={[]}
        />
    );
}
