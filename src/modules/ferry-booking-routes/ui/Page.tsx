import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';
import { getTenantContext } from '@/core/context/getTenantContext';
import { getUserContext } from '@/core/context/getUserContext';
import { SupabaseFerryRouteRepository } from '../infrastructure/SupabaseFerryRouteRepository';
import { FerryBookingService } from '../application/FerryBookingService';
import { notFound, redirect, forbidden } from 'next/navigation';
import { canAccessModule } from '@/core/rbac';
import { moduleRegistry } from '@/core/moduleRegistry';
import { RoutesContent } from './routes-content';

// Force dynamic rendering as we depend on cookies/auth
export const dynamic = 'force-dynamic';

export default async function RoutesPage({ params }: { params: { tenantSlug: string } }) {
    const { tenantSlug } = params;
    // 1. Resolve Auth Context (Hits the memoized React cache from AdminLayout)
    const { resolveAuthContext } = await import('@/core/context/resolveAuthContext');
    const authContext = await resolveAuthContext(tenantSlug);

    if (!authContext) {
        notFound();
    }

    const { user, userContext, tenantContext, tenant } = authContext;

    // 2. Module Access Check
    const moduleDef = moduleRegistry.getModule('ferry-booking-routes');
    if (!moduleDef) {
        console.error("Module 'ferry-booking-routes' not found in registry");
        notFound();
    }

    if (!canAccessModule(moduleDef, userContext)) {
        console.warn(`User ${user.id} denied access to module ferry-booking-routes`);
        forbidden();
    }

    // 3. Granular Feature Permission Check
    // Rule: Must have 'routes.view' or Superuser '*'
    const hasPermission = userContext.permissions.includes('routes.view') || userContext.permissions.includes('*');
    if (!hasPermission) {
        console.warn(`User ${user.id} missing 'routes.view' permission`);
        forbidden();
    }

    // 4. Data Fetch (Strict Repository Pattern)
    const dStart = performance.now();
    const routesRepo = new SupabaseFerryRouteRepository();
    const service = new FerryBookingService(routesRepo);

    // Pass tenant_id explicitly (Fail-Closed)
    const routes = await service.getRoutes(tenant.id);
    const locations = await routesRepo.getLocations(tenant.id);
    const ferries = await routesRepo.getFerries(tenant.id);
    console.log(`[Perf] RoutesPage getRoutes: ${(performance.now() - dStart).toFixed(2)}ms`);

    // 5. Render
    return <RoutesContent routes={routes} locations={locations} ferries={ferries} />;
}
