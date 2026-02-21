// mateusz poponczyk
import { createAuthClient } from '@/infra/supabase/server-auth';
import { ITenantRepository } from '@/core/application/ports/ITenantRepository';
import { Tenant } from '@/core/types';

export class SupabaseTenantRepository implements ITenantRepository {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    async resolveTenantForUser(userId: string, tenantSlug?: string): Promise<Tenant | null> {
        const supabase = this.client || createAuthClient();

        // 1. Explicit Slug Resolution
        if (tenantSlug) {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('slug', tenantSlug)
                .single();

            if (error || !data) return null;

            return data as Tenant;
        }

        // 2. Implicit Resolution (Strict: RPC for Safety)
        // Use SECURITY DEFINER RPC to fetch tenants tenant_users RLS might be too strict.
        const { data: tenants, error } = await supabase.rpc('resolve_user_tenants');

        if (error) {
            console.error("Err resolve_user_tenants:", error);
            return null;
        }
        if (!tenants) return null;

        console.log(`[SupabaseTenantRepository] Implicit Resolution found ${tenants.length} tenants for user ${userId}`);

        if (tenants.length === 1) {
            // Exactly one tenant -> Return it.
            // RPC returns { tenant_id, slug, name }. We map to Tenant type.
            // Since RPC filters for ACTIVE tenants, we can safely set status='active'.
            const t = tenants[0];
            return {
                id: t.tenant_id,
                slug: t.slug,
                name: t.name,
                status: 'active'
            } as Tenant;
        }

        if (tenants.length > 1) {
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
            console.error("Error fetching tenant modules:", JSON.stringify(error, null, 2));
            return [];
        }

        if (!data) return [];

        return data.map((row: { module_id: string }) => row.module_id);
    }

    async listUserTenants(): Promise<Tenant[]> {
        const supabase = this.client || createAuthClient();
        const { data: tenants, error } = await supabase.rpc('resolve_user_tenants');

        if (error || !tenants) return [];

        return tenants.map((t: any) => ({
            id: t.tenant_id,
            slug: t.slug,
            name: t.name,
            status: 'active'
        }));
    }
}
