
import { createAuthClient } from "@/infra/supabase/server-auth";
import { IRoleRepository, CreateRoleDTO, UpdateRoleDTO, Role } from "../domain/ports";

export class SupabaseRoleRepository implements IRoleRepository {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    private get supabase() {
        return this.client || createAuthClient();
    }

    async findByTenant(tenantId: string): Promise<Role[]> {
        const { data, error } = await this.supabase
            .from('auth_roles') // Assuming this table exists from legacy or migration
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) throw error;

        return data.map((r: any) => this.mapToDomain(r));
    }

    async findById(tenantId: string, roleId: string): Promise<Role | null> {
        const { data, error } = await this.supabase
            .from('auth_roles')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', roleId)
            .single();

        if (error || !data) return null;
        return this.mapToDomain(data);
    }

    async create(tenantId: string, role: CreateRoleDTO): Promise<string> {
        // Use RPC if possible, or direct insert if RLS allows (Strict: Prefer RPC)
        // For now, assuming table access or we'd use 'create_role' RPC
        const { data, error } = await this.supabase
            .from('auth_roles')
            .insert({
                tenant_id: tenantId,
                name: role.name,
                description: role.description,
                permissions: role.permissions
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    }

    async update(tenantId: string, roleId: string, data: UpdateRoleDTO): Promise<void> {
        const updates: any = {};
        if (data.description !== undefined) updates.description = data.description;
        if (data.permissions !== undefined) updates.permissions = data.permissions;

        const { error } = await this.supabase
            .from('auth_roles')
            .update(updates)
            .eq('tenant_id', tenantId)
            .eq('id', roleId);

        if (error) throw error;
    }

    async delete(tenantId: string, roleId: string): Promise<void> {
        const { error } = await this.supabase
            .from('auth_roles')
            .delete()
            .eq('tenant_id', tenantId)
            .eq('id', roleId);

        if (error) throw error;
    }

    private mapToDomain(raw: any): Role {
        return {
            id: raw.id,
            name: raw.name,
            description: raw.description,
            permissions: raw.permissions || [],
            tenantId: raw.tenant_id,
            isSystem: raw.is_system || false
        };
    }
}
