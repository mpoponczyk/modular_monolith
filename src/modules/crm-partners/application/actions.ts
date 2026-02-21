
'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabasePartnerRepository } from '../infrastructure/SupabasePartnerRepository';
import { verifyTenantAccess } from '@/core/auth/access';
import { revalidatePath } from 'next/cache';

export async function listPartnersAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'partners.view');

    const repo = new SupabasePartnerRepository(supabase);
    return await repo.findAll(tenantId);
}

export async function createPartnerAction(tenantSlug: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'partners.manage');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const commissionRate = parseFloat(formData.get('commissionRate') as string || '0');
    const isActive = formData.get('isActive') === 'on' || formData.get('isActive') === 'true' || true; // Depending on form
    const type = (formData.get('type') as 'SELLER' | 'BUYER' | 'BOTH') || 'SELLER';
    const nip = formData.get('nip') as string;
    const address = formData.get('address') as string;
    const postalCode = formData.get('postal_code') as string;
    const city = formData.get('city') as string;

    if (!name) throw new Error('Name is required');

    const repo = new SupabasePartnerRepository(supabase);
    await repo.create(tenantId, { name, email, phone, commissionRate, isActive, type, nip, address, postalCode, city });

    revalidatePath(`/admin/t/${tenantSlug}/apps/crm/partners`);
}

export async function updatePartnerAction(tenantSlug: string, partnerId: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'partners.manage');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const commissionRate = parseFloat(formData.get('commissionRate') as string || '0');
    const isActive = formData.get('isActive') === 'on' || formData.get('isActive') === 'true' || true;
    const type = (formData.get('type') as 'SELLER' | 'BUYER' | 'BOTH') || 'SELLER';
    const nip = formData.get('nip') as string;
    const address = formData.get('address') as string;
    const postalCode = formData.get('postal_code') as string;
    const city = formData.get('city') as string;

    if (!name) throw new Error('Name is required');

    const repo = new SupabasePartnerRepository(supabase);
    await repo.update(tenantId, partnerId, { name, email, phone, commissionRate, isActive, type, nip, address, postalCode, city });

    revalidatePath(`/admin/t/${tenantSlug}/apps/crm/partners`);
}

export async function deletePartnerAction(tenantSlug: string, partnerId: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'partners.manage');

    const repo = new SupabasePartnerRepository(supabase);
    await repo.delete(tenantId, partnerId);

    revalidatePath(`/admin/t/${tenantSlug}/apps/crm/partners`);
}
