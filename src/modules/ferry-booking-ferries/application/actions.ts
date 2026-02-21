
'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseFerryRepository } from '../infrastructure/SupabaseFerryRepository';
import { revalidatePath } from 'next/cache';

// import { getTenantId } from '@/core/context/tenant'; // Unused

// Note: Strict mode requires not extracting tenantId from params if possible, 
// using the context or secure means.
// But for actions called from client, we usually pass tenantSlug or have middleware.
// We'll assume the standard pattern:
import { verifyTenantAccess } from '@/core/auth/access'; // Hypothetical helper

export async function listFerriesAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'ferries.view');

    const repo = new SupabaseFerryRepository(supabase, tenantId);
    return await repo.listFerries();
}

export async function createFerryAction(tenantSlug: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'ferries.manage');

    const name = formData.get('name') as string;
    const capacity_pax = parseInt(formData.get('capacity_pax') as string);
    const capacity_cars = parseInt(formData.get('capacity_cars') as string);

    if (!name) throw new Error('Name is required');

    const repo = new SupabaseFerryRepository(supabase, tenantId);
    await repo.createFerry({ name, capacity_pax, capacity_cars });

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/ferries`);
}

export async function updateFerryAction(tenantSlug: string, ferryId: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'ferries.manage');

    const name = formData.get('name') as string;
    const capacity_pax = parseInt(formData.get('capacity_pax') as string);
    const capacity_cars = parseInt(formData.get('capacity_cars') as string);

    if (!name) throw new Error('Name is required');

    const repo = new SupabaseFerryRepository(supabase, tenantId);
    await repo.updateFerry(ferryId, { name, capacity_pax, capacity_cars });

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/ferries`);
}

export async function deleteFerryAction(tenantSlug: string, ferryId: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'ferries.manage');

    const repo = new SupabaseFerryRepository(supabase, tenantId);
    await repo.deleteFerry(ferryId);

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/ferries`);
}

export async function toggleFerryStatusAction(tenantSlug: string, ferryId: string, isActive: boolean) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'ferries.manage');

    const repo = new SupabaseFerryRepository(supabase, tenantId);
    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/ferries`);
}

export async function addZoneAction(tenantSlug: string, ferryId: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'ferries.manage');

    const name = formData.get('name') as string;
    const capacity = parseInt(formData.get('capacity') as string);
    const description = formData.get('description') as string;

    if (!name || isNaN(capacity)) throw new Error('Valid Name and Capacity are required');

    const { error } = await supabase
        .from('mnt_ferry_zones')
        .insert({
            tenant_id: tenantId,
            ferry_id: ferryId,
            name,
            capacity,
            description
        });

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/ferries/${ferryId}`);
}

export async function deleteZoneAction(tenantSlug: string, zoneId: string, ferryId: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'ferries.manage');

    const { error } = await supabase
        .from('mnt_ferry_zones')
        .delete()
        .eq('id', zoneId)
        .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/ferries/${ferryId}`);
}

export async function getFerryDetailsAction(tenantSlug: string, id: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'ferries.view');

    const { data: ferry } = await supabase
        .from("mnt_ferries")
        .select(`*, zones:mnt_ferry_zones(*)`)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

    return ferry;
}
