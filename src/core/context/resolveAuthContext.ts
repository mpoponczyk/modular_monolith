import { getUser } from '@/core/auth/getUser';
import { getSession } from '@/core/auth/getSession';
import { getUserContext } from './getUserContext';
import { getTenantContext } from './getTenantContext';
import { UserContext, TenantContext } from '@/core/types';
import { User } from '@supabase/supabase-js';
import { cache } from 'react';
import { SupabaseTenantRepository } from '@/infra/repositories/SupabaseTenantRepository';
import { cookies, headers } from 'next/headers';

export interface AuthContext {
    user: User;
    userContext: UserContext;
    tenantContext: TenantContext;
}

export const resolveAuthContext = cache(async (tenantSlug?: string): Promise<AuthContext | null> => {
    // 1. Single Auth Call
    const session = await getSession();
    if (!session) return null;

    const user = await getUser();
    if (!user) return null;

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

    const tenantRepo = new SupabaseTenantRepository();
    // Pass candidateSlug (or undefined for implicit check)
    // Implicit Check is handled inside resolveTenantForUser if slug is undefined.
    const tenant = await tenantRepo.resolveTenantForUser(user.id, candidateSlug);

    if (!tenant) {
        // strict fail-closed
        // If we couldn't resolve a tenant, we cannot provide AuthContext.
        // It is up to the caller (Layout/Page) to handle null -> Redirect/Error/SelectTenant.
        return null;
    }

    // 3. Resolve Contexts using the fetched user AND tenant
    const userContext = await getUserContext(user, tenant.id);
    const tenantContext = await getTenantContext(user, tenant);

    if (!userContext || !tenantContext) {
        return null;
    }

    return {
        user,
        userContext,
        tenantContext
    };
});
