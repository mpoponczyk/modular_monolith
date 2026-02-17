// mateusz poponczyk
/**
 * Tenant-Scoped Module Page Component
 * 
 * Orchestrates:
 * 1. Route Resolution (using tenant-agnostic slug)
 * 2. Module Activation Check
 * 3. RBAC Check
 * 4. Component Rendering
 */

import { resolveRoute } from '@/core/router';
import { isModuleActive } from '@/core/activation';
import { canAccessModule } from '@/core/rbac';
import { ComponentType } from 'react';
import { notFound, redirect } from 'next/navigation';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { requireTwoFaVerified } from '@/core/security/serverGuard';

// Enforce dynamic rendering to ensure DB check runs on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TenantPageProps {
    params: Promise<{
        tenantSlug: string;
        slug?: string[]; // Module route segments
    }>;
}

export default async function DynamicTenantRoute({ params }: TenantPageProps) {
    const { tenantSlug, slug } = await params;

    // Handle Root Path: Redirect to Dashboard
    if (!slug || slug.length === 0) {
        redirect(`/admin/t/${tenantSlug}/dashboard`);
    }

    // 0. Resolve Auth Context (Memoized - tenantSlug is key)
    const authContext = await resolveAuthContext(tenantSlug);

    if (!authContext) {
        // Strict Check: Is it Auth Failure or Tenant Failure?
        const { getSession } = await import('@/core/auth/getSession');
        const session = await getSession();

        if (session) {
            // User is logged in, but Context failed (Tenant not found or Access Denied)
            // STRICT: 404 (Security by Obscurity)
            notFound();
        }
        redirect('/login');
    }

    const { tenantContext, userContext } = authContext;

    // 1. Strict 2FA Gate (DB enforced)
    // This protects all module routes under /admin/t/[slug]/...
    await requireTwoFaVerified(tenantSlug, tenantContext.tenantId);

    // 2. Resolve Route (Tenant Agnostic)
    const match = resolveRoute(slug);

    if (!match) {
        // If no match found via registry -> 404
        notFound();
    }

    const { module, route } = match;

    // 3. Check Activation
    if (!isModuleActive(module, tenantContext)) {
        notFound(); // Hiding inactive modules
    }

    // 4. Check Permissions
    if (!canAccessModule(module, userContext)) {
        // Return 403 Forbidden Component or redirect
        // Ideally a dedicated Error Component, but simple text for now
        return <div>403 Forbidden: Missing Permissions</div>;
    }

    // 5. Render Component
    // Cast unknown to ComponentType
    const Component = route.component as ComponentType<any>;

    return (
        <div data-tenant-route>
            <Component tenantSlug={tenantSlug} slug={slug} />
        </div>
    );
}
