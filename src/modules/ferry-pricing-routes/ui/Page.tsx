
import { createAuthClient } from "@/infra/supabase/server-auth";
import { SupabaseTenantRepository } from "@/infra/repositories/SupabaseTenantRepository";
import { SupabaseFerryRouteRepository } from "@/modules/ferry-booking-routes/infrastructure/SupabaseFerryRouteRepository";
import { SupabasePricingRepository } from '../infrastructure/SupabasePricingRepository';
import { notFound, redirect } from "next/navigation";
import { getUserContext } from "@/core/context/getUserContext";
import { getTenantContext } from "@/core/context/getTenantContext";
import { RoutePricingTable } from "./RoutePricingTable";

interface PageProps {
    params: Promise<{ tenantSlug: string }>;
    searchParams: Promise<{ routeId?: string }>;
}

export default async function PricingRoutingPage({ params, searchParams }: PageProps) {
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

    // Fetch Routes and Profiles
    const routeRepo = new SupabaseFerryRouteRepository();
    const pricingRepo = new SupabasePricingRepository();

    const [routes, profiles] = await Promise.all([
        routeRepo.findAll(tenant.id),
        pricingRepo.findAllProfiles(tenant.id)
    ]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Route Pricing</h1>
            <p className="text-gray-500 mb-6 font-light">Assign base pricing profiles to your ferry routes.</p>

            <RoutePricingTable
                tenantId={tenant.id}
                routes={routes}
                profiles={profiles}
            />
        </div>
    );
}
