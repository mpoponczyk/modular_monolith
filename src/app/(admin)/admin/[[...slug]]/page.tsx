/**
 * Main Admin Page Component
 * 
 * Orchestrates:
 * 1. Route Resolution
 * 2. Module Activation Check
 * 3. RBAC Check
 * 4. Component Rendering
 */

import { resolveRoute } from '@/core/router';
import { isModuleActive } from '@/core/activation';
import { canAccessModule } from '@/core/rbac';
import { ComponentType } from 'react';
import { notFound } from 'next/navigation';

// Mock Contexts (These will be replaced by real hooks/providers later)
// For now, we assume a default context for the skeleton.
const mockTenantContext = {
    activeModuleIds: [] // Allow all active system modules
};

const mockUserContext = {
    roles: ['admin'] // Default admin role
};

interface AdminPageProps {
    params: {
        slug?: string[];
    };
}

export default async function AdminPage({ params }: AdminPageProps) {
    const { slug } = params;

    // 1. Resolve Route
    const match = resolveRoute(slug);

    if (!match) {
        // If no match found via registry -> 404
        notFound();
    }

    const { module, route } = match;

    // 2. Check Activation
    // In a real app, await getTenantContext() here
    if (!isModuleActive(module, mockTenantContext)) {
        notFound(); // Hiding inactive modules
    }

    // 3. Check Permissions
    // In a real app, await getUserContext() here
    if (!canAccessModule(module, mockUserContext)) {
        // Return 403 Forbidden Component or redirect
        return <div>403 Forbidden</div>;
    }

    // 4. Render Component
    // Cast unknown to ComponentType
    const Component = route.component as ComponentType<any>;

    return <Component />;
}
