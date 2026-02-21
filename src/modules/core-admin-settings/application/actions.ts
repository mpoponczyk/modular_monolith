'use server';

import { verifyTenantAccess } from '@/core/auth/access';
import { SupabaseSettingsRepository } from '../infrastructure/SupabaseSettingsRepository';
import { TenantSettings } from '../domain/types';
import { revalidatePath } from 'next/cache';
import { createAuthClient } from '@/infra/supabase/server-auth';

const repository = new SupabaseSettingsRepository();

export async function getTenantSettingsAction(tenantSlug: string): Promise<TenantSettings> {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'settings.view');
    return await repository.getSettings(tenantId);
}

export async function updateTenantSettingsAction(tenantSlug: string, settings: Partial<TenantSettings>): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'settings.manage');
        await repository.updateSettings(tenantId, settings);
        revalidatePath(`/admin/t/${tenantSlug}/apps/core-admin/settings`); // Invalidate cache
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
