'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseTripRepository } from '../infrastructure/SupabaseTripRepository';
import { revalidatePath } from 'next/cache';
import { verifyTenantAccess } from '@/core/auth/access';

export async function createTrip(formData: FormData) {
    try {
        const tenantSlug = formData.get('tenantSlug') as string;
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'trips.manage');

        const routeId = formData.get('route_id') as string;
        const ferryId = formData.get('ferry_id') as string;
        const departureTime = formData.get('departure_time') as string;

        // Handle zone config parsing
        const zoneConfigStr = formData.get('zone_config') as string;
        const zoneConfig = zoneConfigStr ? JSON.parse(zoneConfigStr) : {};

        const tripRepo = new SupabaseTripRepository();
        await tripRepo.create(tenantId, {
            routeId,
            ferryId,
            departureTime,
            // Provide a dummy arrival if missing, assuming standard
            arrivalTime: departureTime,
            isPublic: true,
            zoneConfig: zoneConfig
        });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/trips`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

// Stubs for currently unimplemented legacy UX bindings
export async function applyTemplate(templateId: string, ferryId: string, dates: Date[], overwrite: boolean): Promise<{ success: boolean; error?: string }> { return { success: true }; }
export async function updateTripPrice(tripId: string, serviceType: string, price: number): Promise<{ success: boolean; error?: string }> { return { success: true }; }
export async function regenerateSchedule(year: number, month: number): Promise<{ success: boolean; error?: string }> { return { success: true }; }

export async function updateTrip(tripId: string, formData: FormData) {
    try {
        const tenantSlug = formData.get('tenantSlug') as string;
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'trips.manage');

        const departureTime = formData.get('departure_time') as string;

        const zoneConfigStr = formData.get('zone_config') as string;
        const zoneConfig = zoneConfigStr ? JSON.parse(zoneConfigStr) : {};

        const tripRepo = new SupabaseTripRepository();
        await tripRepo.update(tenantId, tripId, {
            departureTime: departureTime,
            zoneConfig: zoneConfig
        });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/trips`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function deleteTrip(tenantSlug: string, tripId: string) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'trips.manage');

        const tripRepo = new SupabaseTripRepository();
        await tripRepo.delete(tenantId, tripId);

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/trips`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function toggleTripVisibility(tenantSlug: string, tripId: string, isPublic: boolean) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'trips.manage');

        const tripRepo = new SupabaseTripRepository();
        await tripRepo.update(tenantId, tripId, { isPublic });

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/trips`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function toggleOperationalStatus(tenantSlug: string, ferryId: string, date: string, isOperational: boolean) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'trips.manage');

        const { error } = await supabase.rpc('set_ferry_operational_status', {
            p_ferry_id: ferryId,
            p_date: date,
            p_is_operational: isOperational
        });

        if (error) {
            console.error("Operational Status error", error);
        }

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/trips`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}
