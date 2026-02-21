'use server';

import { verifyTenantAccess } from '@/core/auth/access';
import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseServiceRepository } from '../infrastructure/SupabaseServiceRepository';
import { Service } from '../domain/service-types';
import { revalidatePath } from 'next/cache';

export async function getServicesAction(tenantSlug: string): Promise<Service[]> {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'services.view');
    const repository = new SupabaseServiceRepository(supabase, tenantId);
    return await repository.getServices();
}

export async function upsertServiceAction(tenantSlug: string, service: Partial<Service>): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'services.manage');
        const repository = new SupabaseServiceRepository(supabase, tenantId);

        if (!service.name) throw new Error('Name is required');

        await repository.upsertService(service);
        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/services`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteServiceAction(tenantSlug: string, serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'services.manage');
        const repository = new SupabaseServiceRepository(supabase, tenantId);

        await repository.deleteService(serviceId);
        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/services`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
