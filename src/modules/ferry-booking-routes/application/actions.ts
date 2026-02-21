'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseFerryRouteRepository } from '../infrastructure/SupabaseFerryRouteRepository';
import { FerryBookingService } from './FerryBookingService';
import { revalidatePath } from 'next/cache';
import { verifyTenantAccess } from '@/core/auth/access';

export async function createRouteAction(formData: FormData) {
    const originId = formData.get('origin_id') as string;
    const destinationId = formData.get('destination_id') as string;
    const durationStr = formData.get('duration') as string;
    const tenantSlug = formData.get('tenantSlug') as string;
    let ferryId = formData.get('ferry_id') as string | null;
    if (ferryId === "none" || !ferryId) ferryId = null;

    const isStandard = formData.get('is_standard') === 'on';

    if (!originId || !destinationId || !durationStr || !tenantSlug) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'routes.manage');

        const repo = new SupabaseFerryRouteRepository();
        await repo.create(tenantId, {
            originId,
            destinationId,
            estimatedDurationMinutes: parseInt(durationStr),
            defaultFerryId: ferryId
            // note: isActive might default to true in RPC, we update it immediately if needed
        });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/routes`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateRouteAction(routeId: string, formData: FormData) {
    const originId = formData.get('origin_id') as string;
    const destinationId = formData.get('destination_id') as string;
    const durationStr = formData.get('duration') as string;
    const tenantSlug = formData.get('tenantSlug') as string;
    let ferryId = formData.get('ferry_id') as string | null;
    if (ferryId === "none" || !ferryId) ferryId = null;

    const isActive = formData.get('is_standard') === 'on';

    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'routes.manage');

        const repo = new SupabaseFerryRouteRepository();
        await repo.update(tenantId, routeId, {
            originId,
            destinationId,
            estimatedDurationMinutes: parseInt(durationStr),
            defaultFerryId: ferryId,
            isActive
        });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/routes`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateRouteStatusAction(tenantSlug: string, routeId: string, isActive: boolean) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'routes.manage');

        const repo = new SupabaseFerryRouteRepository();
        await repo.update(tenantId, routeId, { isActive });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/routes`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteRouteAction(tenantSlug: string, routeId: string) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'routes.manage');

        const repo = new SupabaseFerryRouteRepository();
        await repo.delete(tenantId, routeId);

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/routes`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
