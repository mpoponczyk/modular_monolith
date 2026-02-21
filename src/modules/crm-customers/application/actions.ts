
'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseCustomerRepository } from '../infrastructure/SupabaseCustomerRepository';
import { verifyTenantAccess } from '@/core/auth/access';
import { revalidatePath } from 'next/cache';
import { CreateCustomerDTO, UpdateCustomerDTO } from '../domain/types';

export async function listCustomersAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'crm.view');

    const repo = new SupabaseCustomerRepository(supabase);
    return await repo.findAll(tenantId);
}

export async function createCustomerAction(tenantSlug: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'crm.manage');

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;

    if (!firstName || !lastName || !email) {
        throw new Error('First Name, Last Name, and Email are required');
    }

    const dto: CreateCustomerDTO = {
        firstName,
        lastName,
        email,
        phone: (formData.get('phone') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
        source: (formData.get('source') as string) || 'manual',
        isActive: formData.get('isActive') === 'on'
    };

    const repo = new SupabaseCustomerRepository(supabase);
    await repo.create(tenantId, dto);

    revalidatePath(`/admin/t/${tenantSlug}/apps/crm/customers`);
}

export async function updateCustomerAction(tenantSlug: string, id: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'crm.manage');

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;

    if (!firstName || !lastName || !email) {
        throw new Error('First Name, Last Name, and Email are required');
    }

    const dto: UpdateCustomerDTO = {
        firstName,
        lastName,
        email,
        phone: (formData.get('phone') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
        source: (formData.get('source') as string) || undefined,
        isActive: formData.get('isActive') === 'on'
    };

    const repo = new SupabaseCustomerRepository(supabase);
    await repo.update(tenantId, id, dto);

    revalidatePath(`/admin/t/${tenantSlug}/apps/crm/customers`);
}

export async function deleteCustomerAction(tenantSlug: string, id: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'crm.manage');

    const repo = new SupabaseCustomerRepository(supabase);
    await repo.delete(tenantId, id);

    revalidatePath(`/admin/t/${tenantSlug}/apps/crm/customers`);
}
