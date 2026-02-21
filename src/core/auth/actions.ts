
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';
import { SupabaseUserRepository } from '@/infra/repositories/SupabaseUserRepository';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/core/errors';
import { UserContext, TenantContext } from '@/core/types';

const tenantRepo = new SupabaseTenantRepository();
const userRepo = new SupabaseUserRepository();

/**
 * Pure Logic: Verifies a user has a permission for a tenant.
 * Does NOT perform authentication.
 */
export async function verifyUserPermission(userId: string, tenantId: string, requiredPermission: string): Promise<void> {
    const permissions = await userRepo.getUserPermissions(userId, tenantId);

    // Check permission
    const hasPermission = permissions.includes('*') || permissions.includes(requiredPermission);

    // DEBUG: Append to file so agent can trace sequence
    try {
        const fs = require('fs');
        const logLine = `${new Date().toISOString()} | User: ${userId} | Tenant: ${tenantId} | Req: ${requiredPermission} | Has: ${hasPermission} | PermsCount: ${permissions?.length}\n`;
        fs.appendFileSync('/tmp/permission_debug.log', logLine);
    } catch (e) { }

    if (!hasPermission) {
        throw new ForbiddenError(`Missing required permission: ${requiredPermission}`);
    }
}

/**
 * Ensures the current user has the required permission for the given tenant.
 * Used in Server Actions.
 */
export async function verifyActionPermission(tenantId: string, requiredPermission: string): Promise<UserContext> {
    const { createAuthClient } = await import('@/infra/supabase/server-auth');
    const supabase = await createAuthClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new UnauthorizedError('User not authenticated');
    }

    // Reuse shared logic
    await verifyUserPermission(user.id, tenantId, requiredPermission);

    // Re-fetch permissions (redundant but consistent with signature return)? 
    // Optimization: verifyUserPermission could return permissions.
    // Let's keep it simple for now.
    const permissions = await userRepo.getUserPermissions(user.id, tenantId);

    return { userId: user.id, permissions };
}

/**
 * Resolves the Tenant Context for a Page based on the slug.
 * Used in Server Components (Page.tsx).
 */
/**
 * Resolves the Tenant Context for a Page based on the slug.
 * Used in Server Components (Page.tsx).
 * OPTIMIZED: Uses resolveAuthContext for request-level caching.
 */
export async function getTenantContextForPage(tenantSlug: string): Promise<TenantContext> {
    // 1. Try to use the shared request cache first
    const { resolveAuthContext } = await import('@/core/context/resolveAuthContext');
    const authContext = await resolveAuthContext(tenantSlug);

    if (authContext) {
        return authContext.tenantContext;
    }

    // Fallback (should rarely happen if resolveAuthContext works)
    // But if resolveAuthContext returned null (e.g. mismatch), we might want to throw or re-fetch.
    // For now, let's keep the old logic as a robust fallback OR throw NotFound.
    throw new NotFoundError(`Tenant not found or access denied: ${tenantSlug}`);
}

/**
 * Verifies tenant access and optionally checks permissions.
 * Compatible replacement for access.ts usage in Pages.
 * OPTIMIZED: Uses resolveAuthContext.
 */
export async function verifyPageAccess(tenantSlug: string, requiredPermission?: string): Promise<{ tenantId: string; user: any }> {
    const { resolveAuthContext } = await import('@/core/context/resolveAuthContext');

    // 1. Get Cached Context
    const authContext = await resolveAuthContext(tenantSlug);

    if (!authContext) {
        throw new NotFoundError(`Tenant not found or access denied: ${tenantSlug}`);
    }

    const { tenantContext, userContext, user } = authContext;

    // 2. Check Permissions (InMemory check from UserContext)
    if (requiredPermission) {
        const hasPermission = userContext.permissions.includes('*') || userContext.permissions.includes(requiredPermission);
        if (!hasPermission) {
            throw new ForbiddenError(`Missing required permission: ${requiredPermission}`);
        }
    }

    return { tenantId: tenantContext.tenantId, user };
}
