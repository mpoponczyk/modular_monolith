
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';
import { getUserContext } from '@/core/context/getUserContext';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/core/errors';

export async function verifyTenantAccess(
    supabase: SupabaseClient,
    tenantSlug: string,
    requiredPermission?: string
): Promise<{ tenantId: string; user: any }> {

    // 1. Get User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new UnauthorizedError('User not authenticated');
    }

    // 2. Resolve Tenant
    const tenantRepo = new SupabaseTenantRepository();
    // We can't use resolveTenantForUser directly efficiently without RLS or service role if we want strict security?
    // Actually, resolveTenantForUser uses an RPC or query that respects RLS.
    // Ensure we are using the CLIENT supabase if possible, but Repository usually instantiates its own client?
    // SupabaseTenantRepository usually creates a client. 
    // Let's assume resolveTenantForUser works for the user.
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);

    if (!tenant) {
        throw new NotFoundError(`Tenant not found: ${tenantSlug}`);
    }

    // 3. Check Permissions (if required)
    if (requiredPermission) {
        const context = await getUserContext(user.id, tenant.id);
        if (!context) {
            throw new ForbiddenError('Could not resolve user context');
        }

        const hasPermission = context.permissions.includes('*') || context.permissions.includes(requiredPermission);
        if (!hasPermission) {
            throw new ForbiddenError(`Missing required permission: ${requiredPermission}`);
        }
    }

    return { tenantId: tenant.id, user };
}
