'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseGanttService } from '../infrastructure/SupabaseGanttService';
import { SupabaseCalendarService } from '../infrastructure/SupabaseCalendarService';
import { verifyTenantAccess } from '@/core/auth/access';
import { revalidatePath } from 'next/cache';

export async function getGanttDataAction(tenantSlug: string, startDate: string, endDate: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.view');

    const service = new SupabaseGanttService();
    return await service.getGanttData(tenantId, startDate, endDate);
}

// Ensure the gantt app can mutate trips for the current tenant
export async function createTrip(formData: FormData) {
    try {
        const tenantSlug = formData.get('tenantSlug') as string;
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.manage');

        const routeId = formData.get('route_id') as string;
        const ferryId = formData.get('ferry_id') as string;
        const departureTime = formData.get('departure_time') as string;

        const zoneConfigStr = formData.get('zone_config') as string;
        const zoneConfig = zoneConfigStr ? JSON.parse(zoneConfigStr) : {};

        const service = new SupabaseCalendarService();
        await service.createTrip(tenantId, {
            route_id: routeId,
            ferry_id: ferryId,
            departure_time: departureTime,
            arrival_time: departureTime,
            is_public: true,
            zone_config: zoneConfig
        });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-planning/gantt`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function updateTrip(tripId: string, formData: FormData) {
    try {
        const tenantSlug = formData.get('tenantSlug') as string;
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.manage');

        const departureTime = formData.get('departure_time') as string;
        const zoneConfigStr = formData.get('zone_config') as string;
        const zoneConfig = zoneConfigStr ? JSON.parse(zoneConfigStr) : {};

        const service = new SupabaseCalendarService();
        await service.updateTrip(tenantId, tripId, {
            departure_time: departureTime,
            zone_config: zoneConfig
        });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-planning/gantt`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function deleteTrip(tenantSlug: string, tripId: string) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.manage');

        const service = new SupabaseCalendarService();
        await service.deleteTrip(tenantId, tripId);

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-planning/gantt`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function toggleTripVisibility(tenantSlug: string, tripId: string, isPublic: boolean) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.manage');

        const service = new SupabaseCalendarService();
        await service.updateTrip(tenantId, tripId, { is_public: isPublic });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-planning/gantt`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function updateTripPrice(tripId: string, serviceType: string, price: number): Promise<{ success: boolean; error?: string }> { return { success: true }; }
