
'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabasePricingRepository } from '../infrastructure/SupabasePricingRepository';
import { verifyTenantAccess } from '@/core/auth/access';
import { revalidatePath } from 'next/cache';

export async function listProfilesAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'pricing.view');

    const repo = new SupabasePricingRepository(supabase);
    return await repo.findAllProfiles(tenantId);
}

export async function createProfileAction(tenantSlug: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'pricing.manage');

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const basePriceAdult = parseFloat(formData.get('basePriceAdult') as string || '0');
    const basePriceChild = parseFloat(formData.get('basePriceChild') as string || '0');
    const basePriceVehicle = parseFloat(formData.get('basePriceVehicle') as string || '0');
    const basePriceBike = parseFloat(formData.get('basePriceBike') as string || '0');
    const currency = formData.get('currency') as string || 'USD';
    const isActive = formData.get('isActive') === 'on';

    if (!name) throw new Error('Name is required');

    const repo = new SupabasePricingRepository(supabase);
    await repo.createProfile(tenantId, {
        name, description,
        basePriceAdult, basePriceChild, basePriceVehicle, basePriceBike,
        currency, isActive
    });

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-pricing/profiles`);
}

export async function updateProfileAction(tenantSlug: string, profileId: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'pricing.manage');

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const basePriceAdult = parseFloat(formData.get('basePriceAdult') as string || '0');
    const basePriceChild = parseFloat(formData.get('basePriceChild') as string || '0');
    const basePriceVehicle = parseFloat(formData.get('basePriceVehicle') as string || '0');
    const basePriceBike = parseFloat(formData.get('basePriceBike') as string || '0');
    const currency = formData.get('currency') as string || 'USD';
    const isActive = formData.get('isActive') === 'on';

    if (!name) throw new Error('Name is required');

    const repo = new SupabasePricingRepository(supabase);
    await repo.updateProfile(tenantId, profileId, {
        name, description,
        basePriceAdult, basePriceChild, basePriceVehicle, basePriceBike,
        currency, isActive
    });

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-pricing/profiles`);
}

export async function deleteProfileAction(tenantSlug: string, profileId: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'pricing.manage');

    const repo = new SupabasePricingRepository(supabase);
    await repo.deleteProfile(tenantId, profileId);

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-pricing/profiles`);
}
