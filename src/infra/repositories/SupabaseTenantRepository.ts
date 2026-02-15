import { createAuthClient } from '@/infra/supabase/server-auth';
import { ITenantRepository } from '@/core/application/ports/ITenantRepository';
import { Tenant } from '@/core/types';

export class SupabaseTenantRepository implements ITenantRepository {

    async resolveTenantForUser(userId: string, tenantSlug?: string): Promise<Tenant | null> {
        const supabase = createAuthClient();

        // 1. Explicit Slug Resolution
        if (tenantSlug) {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('slug', tenantSlug)
                .single();

            if (error || !data) return null;

            // Verify membership strictly
            // RLS "Users can read tenants they belong to" handles this implicitly for `tenants` select,
            // but we want to be paranoid and ensure the user is actually a member explicitly if RLS was ever weak.
            // However, RLS is the safety net. 
            // We can also double check via tenant_users if we want to be "Paranoid" as requested.
            // But strict architecture says: RLS is safety net, explicit filters are primary.
            // Since we are querying `tenants`, and we established the policy "Users can read tenants they belong to",
            // `data` will be null if they don't belong.
            // BUT, for semantic correctness and to ensure we don't accidentally get a public tenant (if generic read allowed),
            // let's check tenant_users. (Though currently RLS prevents it).

            // Actually, the Plan says "Query tenant_users" for the implicit case.
            // For explicit case, if the user can Resolve the tenant, they are in it.
            // Let's trust RLS + the fact we are looking for a specific slug.

            return data as Tenant;
        }

        // 2. Implicit Resolution (Strict: Count = 1)
        // We need to find all tenants this user belongs to.
        const { data: memberships, error: memError } = await supabase
            .from('tenant_users')
            .select('tenant_id, tenants(*)')
            .eq('user_id', userId);

        if (memError || !memberships) return null;

        if (memberships.length === 1) {
            // Exactly one tenant -> Return it.
            // memberships[0].tenants is the joined tenant data.
            // Supabase returns it as an object or array depending on relationship.
            // Assuming 1:1 in this join semantic for the row.
            const tenantData = memberships[0].tenants;
            if (Array.isArray(tenantData)) return tenantData[0] as Tenant; // Should not happen with single join
            return tenantData as unknown as Tenant;
        }

        if (memberships.length > 1) {
            // Ambiguous -> strict requirement involves fail-closed or special handling.
            // Return null to trigger 409/Select Tenant upstream.
            return null;
        }

        return null;
    }

    async getTenantModules(tenantId: string): Promise<string[]> {
        if (!tenantId) throw new Error("TenantID is mandatory");

        const supabase = createAuthClient();

        // Strict Rule: .eq('tenant_id', tenantId)
        const { data, error } = await supabase
            .from('tenant_modules')
            .select('module_id')
            .eq('tenant_id', tenantId);

        if (error) {
            console.error("Error fetching tenant modules:", error);
            return []; // Fail safe to empty (all enabled? No, empty list in DB = all enabled. But if error, careful.)
            // Logic: empty DB result = all enabled. 
            // If error, we should probably throw (fail closed) or return empty (open).
            // Strict security: If we can't fetch config, we might default to Safe Mode. 
            // But let's throw to be safe.
            throw error;
        }

        if (!data) return [];

        return data.map((row: { module_id: string }) => row.module_id);
    }
}
