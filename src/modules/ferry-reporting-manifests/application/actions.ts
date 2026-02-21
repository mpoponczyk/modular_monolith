'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseManifestRepository } from '../infrastructure/SupabaseManifestRepository';
import { verifyTenantAccess } from '@/core/auth/access';

// Legacy compatibility exports
export async function getManifestFerriesAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'manifests.view');

    const repo = new SupabaseManifestRepository(supabase);
    return await repo.getFerries(tenantId);
}

export async function getManifestTripsForMonthAction(tenantSlug: string, startDate: Date, endDate: Date) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'manifests.view');

    const repo = new SupabaseManifestRepository(supabase);
    return await repo.getTripsForMonth(tenantId, startDate, endDate);
}

export async function getManifestDetailRawAction(tenantSlug: string, tripId: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'manifests.view');

    const repo = new SupabaseManifestRepository(supabase);
    return await repo.getTripDetail(tenantId, tripId);
}
