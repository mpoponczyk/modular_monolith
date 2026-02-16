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

interface TenantPageProps {
    params: Promise<{
        tenantSlug: string;
        slug?: string[]; // Module route segments
    }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
    const { tenantSlug, slug } = await params;

    // 0. Resolve Auth Context (Memoized - tenantSlug is key)
    const authContext = await resolveAuthContext(tenantSlug);

    if (!authContext) {
        redirect('/login');
    }

    const { tenantContext, userContext } = authContext;

    // 1. Resolve Route (Tenant Agnostic)
    const match = resolveRoute(slug);

    if (!match) {
        // If no match found via registry -> 404
        notFound();
    }

    const { module, route } = match;

    // 2. Check Activation
    if (!isModuleActive(module, tenantContext)) {
        notFound(); // Hiding inactive modules
    }

    // 3. Check Permissions
    if (!canAccessModule(module, userContext)) {
        // Return 403 Forbidden Component or redirect
        // Ideally a dedicated Error Component, but simple text for now
        return <div>403 Forbidden: Missing Permissions</div>;
    }

    // 4. Render Component
    // Cast unknown to ComponentType
    const Component = route.component as ComponentType<any>;

    return <Component tenantSlug={tenantSlug} slug={slug} />;
}
