
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/infra/database.types';

import { Role } from '../domain/types';

export class RolesRepository {
    constructor(private supabase: SupabaseClient<Database>, private tenantId: string) {
        if (!tenantId) throw new Error('Tenant ID is required');
    }

    async createRole(name: string, description?: string): Promise<string> {
        const { data, error } = await this.supabase.rpc('create_role', {
            p_tenant_id: this.tenantId,
            p_name: name,
            p_description: description || null
        });

        if (error) throw error;
        return data; // Returns UUID
    }

    async updateRole(roleId: string, name: string, description?: string): Promise<void> {
        const { error } = await this.supabase.rpc('update_role', {
            p_tenant_id: this.tenantId,
            p_role_id: roleId,
            p_name: name,
            p_description: description || null
        });

        if (error) throw error;
    }

    async updateRolePermissions(roleId: string, permissions: string[]) {
        // 1. Get current permissions
        const { data: current, error: listError } = await this.supabase
            .from('role_permissions')
            .select('permission_key')
            .eq('role_id', roleId)
            .eq('tenant_id', this.tenantId);

        if (listError) throw listError;
        const currentSet = new Set((current as any[]).map((p: any) => p.permission_key));
        const newSet = new Set(permissions);

        // 2. Diff
        const toAdd = permissions.filter(p => !currentSet.has(p));
        const toRemove = Array.from(currentSet).filter(p => !newSet.has(p));

        // 3. Apply changes via RPCs (for correct authorization)
        for (const p of toAdd) {
            const { error } = await this.supabase.rpc('assign_permission_to_role', {
                p_tenant_id: this.tenantId,
                p_role_id: roleId,
                p_permission_key: p
            });
            if (error) throw error;
        }

        for (const p of toRemove) {
            const { error } = await this.supabase.rpc('revoke_permission_from_role', {
                p_tenant_id: this.tenantId,
                p_role_id: roleId,
                p_permission_key: p
            });
            if (error) throw error;
        }
    }

    async deleteRole(roleId: string): Promise<void> {
        const { error } = await this.supabase.rpc('delete_role', {
            p_tenant_id: this.tenantId,
            p_role_id: roleId
        });
        if (error) throw error;
    }

    async listRoles(): Promise<(Role & { permissions: string[] })[]> {
        const { data, error } = await this.supabase
            .from('roles')
            .select('*, role_permissions(permission_key)')
            .eq('tenant_id', this.tenantId)
            .order('name');

        if (error) throw error;

        return data.map((r: any) => ({
            id: r.id,
            tenant_id: r.tenant_id,
            name: r.name,
            description: r.description,
            permissions: r.role_permissions.map((rp: any) => rp.permission_key)
        }));
    }

    async listPermissions(): Promise<{ key: string; description: string }[]> {
        const { data, error } = await this.supabase
            .from('permissions')
            .select('key, description')
            .order('key');

        if (error) throw error;
        if (error) throw error;
        return data as unknown as { key: string; description: string }[];
    }
}
