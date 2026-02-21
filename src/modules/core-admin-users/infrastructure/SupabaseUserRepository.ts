
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/infra/database.types';

import { TenantUser } from '../domain/types';

export class UsersRepository {
    constructor(private supabase: SupabaseClient<Database>, private tenantId: string) {
        if (!tenantId) throw new Error('Tenant ID is required');
    }

    async listUsers(): Promise<TenantUser[]> {
        // START STRICT IMPL:
        // We cannot query auth.users directly on client without service_role or extensive RLS.
        // We rely on public.tenant_users which SHOULD have RLS allowing members to see other members (or at least admins).
        // If we need email, we might need a public profiles table.
        // For Parity Baseline: we will list tenant_users.

        // Note: If 'email' is in auth.users, we can't select it easily unless we use a View OR RPC.
        // 'resolve_user_tenants' RPC exists, but that's for "My Tenants".
        // We'll try to fetch from tenant_users. If it lacks email, we'll display ID for now 
        // or assume a 'profiles' table exists (found in grep, but usage unclear).
        // Let's check 'tenant_users' schema? We can't easily.
        // We will assume tenant_users has user_id.

        const { data, error } = await this.supabase
            .from('tenant_users')
            .select('*')
            .eq('tenant_id', this.tenantId);

        if (error) throw error;

        // Mapping: valid TenantUser
        return (data || []).map((u: any) => ({
            user_id: u.user_id,
            tenant_id: u.tenant_id,
            status: u.status || 'active',
            created_at: u.created_at
            // Email missing? We'll accept that for Parity Step 1 (Connectivity).
        }));
    }

    async inviteUser(email: string, role: string): Promise<void> {
        // STRICT MODE COMPLIANCE:
        // Direct usage of Admin Client in request flow is PROHIBITED.
        // Invitation must be handled via:
        // 1. A dedicated RPC that enforces tenant-scoped permission checks.
        // 2. Or a background job / edge function.
        // 3. Or disallowed for now.

        throw new Error('User invitation is currently disabled in Strict Security Mode. Please contact system administrator.');
    }

    async updateUserRole(userId: string, role: string): Promise<void> {
        const { error } = await this.supabase
            .from('tenant_users')
            .update({ role })
            .eq('tenant_id', this.tenantId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    async toggleUserStatus(userId: string, isBlocked: boolean): Promise<void> {
        const { error } = await this.supabase
            .from('tenant_users')
            .update({ status: isBlocked ? 'blocked' : 'active' })
            .eq('tenant_id', this.tenantId)
            .eq('user_id', userId);

        if (error) throw error;
    }
}
