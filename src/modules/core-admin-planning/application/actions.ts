
'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabasePlanningRepository } from '../infrastructure/SupabasePlanningRepository';
import { verifyTenantAccess } from '@/core/auth/access';

export async function listPlanningItemsAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.view');

    const repo = new SupabasePlanningRepository();
    return await repo.getItems(tenantId);
}
