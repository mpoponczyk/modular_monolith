// mateusz poponczyk
import { TenantContext } from '@/core/types';
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';

import { cache } from 'react';

export const getTenantContext = cache(async (tenantId: string, tenantSlug: string): Promise<TenantContext | null> => {
    if (!tenantId || !tenantSlug) {
        return null;
    }

    const tenantRepo = new SupabaseTenantRepository();

    try {
        const activeModuleIds = await tenantRepo.getTenantModules(tenantId);

        return {
            tenantId: tenantId,
            slug: tenantSlug,
            activeModuleIds
        };
    } catch (error) {
        console.error("Failed to resolve tenant context", error);
        return null;
    }
});
