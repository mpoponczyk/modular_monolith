import { User } from '@supabase/supabase-js';
import { Tenant, TenantContext } from '@/core/types';
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';

export async function getTenantContext(user: User, tenant: Tenant): Promise<TenantContext | null> {
    if (!user || !tenant) {
        return null;
    }

    const tenantRepo = new SupabaseTenantRepository();

    try {
        const activeModuleIds = await tenantRepo.getTenantModules(tenant.id);

        return {
            tenantId: tenant.id,
            slug: tenant.slug,
            activeModuleIds
        };
    } catch (error) {
        console.error("Failed to resolve tenant context", error);
        return null;
    }
}
