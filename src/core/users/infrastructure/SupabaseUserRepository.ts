
import { createAuthClient } from "@/infra/supabase/server-auth";
import { IUserRepository, CreateUserDTO, UpdateUserDTO, User } from "../domain/ports";

export class SupabaseUserRepository implements IUserRepository {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    private get supabase() {
        return this.client || createAuthClient();
    }

    async findByTenant(tenantId: string): Promise<User[]> {
        // Querying secure view/function that joins auth.users with tenant_members/roles
        // Since we cannot query auth.users directly from client usually, we rely on RPC or a public profile table.
        // For this strict architecture, we assume 'mnt_users' or similar projection exists or we use RPC.

        // PROPOSAL: Use an RPC 'get_tenant_users' to safely fetch users for a tenant
        const { data, error } = await this.supabase
            .rpc('get_tenant_users', { p_tenant_id: tenantId });

        if (error) throw error;

        return data.map((u: any) => this.mapToDomain(u));
    }

    async findById(tenantId: string, userId: string): Promise<User | null> {
        const { data, error } = await this.supabase
            .rpc('get_tenant_user_by_id', { p_tenant_id: tenantId, p_user_id: userId });

        if (error || !data || data.length === 0) return null;
        return this.mapToDomain(data[0]);
    }

    async invite(tenantId: string, user: CreateUserDTO): Promise<string> {
        // Invitaion logic (likely calls Supabase Admin API via RPC or Edge Function)
        // For now, strict placeholder to ensure interface compliance
        const { data, error } = await this.supabase
            .rpc('invite_tenant_user', {
                p_tenant_id: tenantId,
                p_email: user.email,
                p_role: user.role,
                p_full_name: user.fullName
            });

        if (error) throw error;
        return data as string;
    }

    async update(tenantId: string, userId: string, data: UpdateUserDTO): Promise<void> {
        const { error } = await this.supabase
            .rpc('update_tenant_user', {
                p_tenant_id: tenantId,
                p_user_id: userId,
                p_role: data.role,
                p_full_name: data.fullName,
                p_is_active: data.isActive
            });

        if (error) throw error;
    }

    async remove(tenantId: string, userId: string): Promise<void> {
        const { error } = await this.supabase
            .rpc('remove_tenant_user', {
                p_tenant_id: tenantId,
                p_user_id: userId
            });

        if (error) throw error;
    }

    private mapToDomain(raw: any): User {
        return {
            id: raw.id,
            email: raw.email,
            fullName: raw.full_name || raw.user_metadata?.full_name,
            role: raw.role || 'member',
            tenantId: raw.tenant_id,
            isActive: raw.is_active ?? true,
            createdAt: raw.created_at,
            lastLoginAt: raw.last_sign_in_at
        };
    }
}
