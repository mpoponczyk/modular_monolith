'use server';

import { verifyActionPermission } from '@/core/auth/actions';
import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseCockpitRepository } from '../infrastructure/SupabaseCockpitRepository';
import { Cockpit, CockpitConfig } from '../domain/types';
import { revalidatePath } from 'next/cache';

const repository = new SupabaseCockpitRepository();

export async function getCockpitsAction(tenantId: string): Promise<Cockpit[]> {
    await verifyActionPermission(tenantId, 'cockpits.manage');
    return await repository.getCockpits(tenantId);
}

export async function upsertCockpitAction(tenantId: string, id: string | null, name: string, config: CockpitConfig): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        await verifyActionPermission(tenantId, 'cockpits.manage');
        const newId = await repository.upsertCockpit(tenantId, id, name, config);
        revalidatePath(`/admin/t/${tenantId}/apps/core-admin/cockpits`);
        return { success: true, id: newId };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteCockpitAction(tenantId: string, id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await verifyActionPermission(tenantId, 'cockpits.manage');
        await repository.deleteCockpit(tenantId, id);
        revalidatePath(`/admin/t/${tenantId}/apps/core-admin/cockpits`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
