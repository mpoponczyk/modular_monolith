// mateusz poponczyk
import { getUser } from '@/core/auth/getUser';
import { getUserContext } from './getUserContext';
import { getTenantContext } from './getTenantContext';
import { UserContext, TenantContext, Tenant } from '@/core/types';
import { User } from '@supabase/supabase-js';
import { cache } from 'react';
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';
import { cookies, headers } from 'next/headers';

export interface AuthContext {
    user: User;
    userContext: UserContext;
    tenantContext: TenantContext;
    tenant: Tenant; // Optionally expose tenant if needed downstream
}

const resolveTenantCached = cache(async (userId: string, candidateSlug?: string) => {
    const tenantRepo = new SupabaseTenantRepository();
    return await tenantRepo.resolveTenantForUser(userId, candidateSlug);
});

export const resolveAuthContext = cache(async (tenantSlug?: string): Promise<AuthContext | null> => {
    const start = performance.now();
    // 1. Single Auth Call - Prefer getUser for stricter server-side validation
    const user = await getUser();
    if (!user) {
        console.log('[resolveAuthContext] getUser() returned null/undefined');
        // Silent return for unauthenticated - caller handles redirect
        return null;
    }
    // console.log(`[resolveAuthContext] User: ${user.id}`);

    // 2. Resolve Tenant Logic (Precedence: Slug > Header > Cookie > Implicit)
    let candidateSlug: string | undefined = tenantSlug;

    if (!candidateSlug) {
        // Fallback: Header (API/HTMX)
        const headerStore = await headers();
        candidateSlug = headerStore.get('x-tenant-slug') || undefined;
    }

    if (!candidateSlug) {
        // Fallback: Cookie (Persisted)
        const cookieStore = await cookies();
        candidateSlug = cookieStore.get('tenant_slug')?.value;
    }

    // Use globally cached resolver
    const tenant = await resolveTenantCached(user.id, candidateSlug);

    if (!tenant) {
        console.log(`[resolveAuthContext] resolveTenantForUser returned null. User: ${user.id}, Slug: ${candidateSlug}`);
        if (candidateSlug) {
            // Only log error if we explicitly tried to find a specific slug and failed
            console.error(`[resolveAuthContext] Failed to resolve Tenant. Slug: ${candidateSlug}, User: ${user.id}`);
        }
        // If implicit (undefined slug) and found nothing/ambiguous, strictly return null.
        return null;
    }

    // 3. Resolve Contexts using primitives
    const tStart = performance.now();
    const [userContext, tenantContext] = await Promise.all([
        getUserContext(user.id, tenant.id),
        getTenantContext(tenant.id, tenant.slug)
    ]);
    console.log(`[Perf] resolveAuthContext (Contexts primitive cache): ${(performance.now() - tStart).toFixed(2)}ms`);

    if (!userContext) {
        console.error(`[resolveAuthContext] Failed to resolve UserContext for ${user.id} in ${tenant.id}`);
        return null;
    }
    if (!tenantContext) {
        console.error(`[resolveAuthContext] Failed to resolve TenantContext for ${tenant.id}`);
        return null;
    }

    console.log(`[Perf] resolveAuthContext (Total): ${(performance.now() - start).toFixed(2)}ms`);

    return {
        user,
        userContext,
        tenantContext,
        tenant
    };
});
