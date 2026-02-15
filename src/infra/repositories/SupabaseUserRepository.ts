import { createAuthClient } from '@/infra/supabase/server-auth';
import { IUserRepository } from '@/core/application/ports/IUserRepository';

export class SupabaseUserRepository implements IUserRepository {

    async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
        if (!userId) throw new Error("UserId is mandatory");
        if (!tenantId) throw new Error("TenantID is mandatory");

        const supabase = createAuthClient();

        // Query: Tenant Users -> Roles -> Role Permissions -> Permissions
        // We enforce tenant_id check on tenant_users AND roles for paranoia.
        // Rule: .eq('tenant_id', tenantId) MUST be present.

        // We'll query tenant_users to get the role, then join permissions.
        // Actually, we can join deeply.
        // tenant_users (filter by tenant_id, user_id) -> roles -> role_permissions -> permissions

        const { data, error } = await supabase
            .from('tenant_users')
            .select(`
                role_id,
                roles!inner (
                    id,
                    tenant_id,
                    role_permissions!inner (
                        permissions!inner (
                            name
                        )
                    )
                )
            `)
            .eq('tenant_id', tenantId) // STRICT TENANT FILTER
            .eq('user_id', userId)
            .single();

        if (error) {
            // It's possible the user has no role or row doesn't exist.
            // Check code?
            return [];
        }

        if (!data || !data.roles) return [];

        // flatten permissions
        // flatten permissions
        // data.roles might be an array or object depending on relationship inference
        const roleData = Array.isArray(data.roles) ? data.roles[0] : data.roles;

        if (!roleData) return [];

        const rolePermissions = roleData.role_permissions;

        if (!Array.isArray(rolePermissions)) return [];

        const permissions = rolePermissions
            .map((rp: any) => rp.permissions?.name)
            .filter((name: any): name is string => typeof name === 'string');

        // We return raw permissions, including '*'.
        // Expansion happens in the Application/RBAC layer, not here.

        return permissions;
    }
}
