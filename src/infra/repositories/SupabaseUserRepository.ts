// mateusz poponczyk
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
        // Correct Column: permissions(key) NOT permissions(name) based on 20260218180000_core_roles.sql

        const { data, error } = await supabase
            .from('tenant_users')
            .select(`
                role_id,
                roles!inner (
                    id,
                    tenant_id,
                    role_permissions!inner (
                        permissions!inner (
                            key
                        )
                    )
                )
            `)
            .eq('tenant_id', tenantId) // STRICT TENANT FILTER
            .eq('user_id', userId)
            .single();

        console.log(`[Repo Debug] permissions for ${userId} in ${tenantId}`);
        console.log(`Data: ${JSON.stringify(data, null, 2)}`);
        console.log(`Error: ${JSON.stringify(error, null, 2)}`);

        if (error) {
            return [];
        }

        if (!data || !data.roles) return [];

        // flatten permissions
        // data.roles might be an array or object depending on relationship inference
        const roleData = Array.isArray(data.roles) ? data.roles[0] : data.roles;

        if (!roleData) return [];

        const rolePermissions = roleData.role_permissions;

        if (!Array.isArray(rolePermissions)) return [];

        const permissions = rolePermissions
            .map((rp: any) => rp.permissions?.key) // Use 'key'
            .filter((key: any): key is string => typeof key === 'string');

        // We return raw permissions, including '*'.
        // Expansion happens in the Application/RBAC layer, not here.

        return permissions;
    }
}
