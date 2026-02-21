
import { notFound, redirect } from 'next/navigation';
import { verifyPageAccess } from '@/core/auth/actions';
import { moduleRegistry } from '@/core/moduleRegistry';
import { ModuleDefinition, RouteDefinition } from '@/core/types';

// Helper to match route paths with support for dynamic segments like [id]
function matchRoute(routePath: string, requestPath: string): { matches: boolean; params?: Record<string, string> } {
    const normalizedRoute = routePath.replace(/\/$/, '') || '/';
    const normalizedRequest = requestPath.replace(/\/$/, '') || '/';

    if (normalizedRoute === normalizedRequest) {
        return { matches: true, params: {} };
    }

    // Support dynamic segments like [id]
    const routeParts = normalizedRoute.split('/');
    const requestParts = normalizedRequest.split('/');

    if (routeParts.length !== requestParts.length) {
        return { matches: false };
    }

    const params: Record<string, string> = {};
    for (let i = 0; i < routeParts.length; i++) {
        const routePart = routeParts[i];
        const reqPart = requestParts[i];

        if (routePart.startsWith('[') && routePart.endsWith(']')) {
            const paramName = routePart.slice(1, -1);
            // Ignore catch-all for now
            if (!paramName.startsWith('...')) {
                params[paramName] = reqPart;
                continue;
            }
        }

        if (routePart !== reqPart) {
            return { matches: false };
        }
    }

    return { matches: true, params };
}

export default async function DynamicModulePage({
    params
}: {
    params: Promise<{ tenantSlug: string; slug: string[] }>
}) {
    const { tenantSlug, slug } = await params;

    // Handle Root Path: Redirect to Dashboard (if slug is miraculously empty)
    if (!slug || !Array.isArray(slug) || slug.length === 0) {
        redirect(`/admin/t/${tenantSlug}/dashboard`);
    }

    // 1. Resolve Path from Slug Array
    // e.g. ['core-admin', 'sessions'] -> 'core-admin/sessions'
    const path = slug.join('/');

    // 2. Resolve Module (Longest Prefix Match)
    const modules = moduleRegistry.getModules()
        .sort((a, b) => b.id.length - a.id.length); // Longest first

    let matchedModule: ModuleDefinition | undefined;
    let remainingPath = '';

    for (const mod of modules) {
        if (path === mod.id || path.startsWith(mod.id + '/')) {
            matchedModule = mod;
            remainingPath = path.substring(mod.id.length) || '/';
            // Ensure remaining path starts with / if it's not empty
            if (!remainingPath.startsWith('/')) remainingPath = '/' + remainingPath;
            break;
        }
    }

    if (!matchedModule) {
        console.warn(`[DynamicRouter] No module found for path: ${path}`);
        notFound();
    }

    // 3. System & Tenant Access Check
    // verifyPageAccess checks Tenant existence AND optionally permissions
    // It returns user and tenantId.
    // It also internally calls getTenantContextForPage which checks activeModuleIds.
    // However, verifyPageAccess DOES NOT check activeModuleIds against the SPECIFIC module we just found.
    // We need to do that manually.

    const { tenantId, user } = await verifyPageAccess(tenantSlug);

    // 3.1. System Active Check
    if (!matchedModule.system.isActive) {
        console.warn(`[DynamicRouter] Module ${matchedModule.id} is system-disabled`);
        notFound();
    }

    // 3.2. Tenant Module Allow-List Check
    // We need to re-fetch context or trust verifyPageAccess?
    // verifyPageAccess returns tenantId. We can't access activeModuleIds from it directly.
    // Let's import getTenantContextForPage instead/also.
    const { getTenantContextForPage } = await import('@/core/auth/actions');
    const context = await getTenantContextForPage(tenantSlug);

    if (context.activeModuleIds.length > 0 && !context.activeModuleIds.includes(matchedModule.id)) {
        console.warn(`[DynamicRouter] Module ${matchedModule.id} not enabled for tenant ${context.slug}`);
        notFound();
    }

    // 4. Permissions Check
    const requiredPermissions = matchedModule.permissions.requiredPermissions;
    if (requiredPermissions && requiredPermissions.length > 0) {
        const { verifyUserPermission } = await import('@/core/auth/actions');
        // Check ALL permissions? Or ANY?
        // Usually it's AND for module access.
        // Let's check each.
        try {
            const pStart = performance.now();
            await Promise.all(requiredPermissions.map(perm => verifyUserPermission(user.id, tenantId, perm)));
            console.log(`[Perf] DynamicModulePage Verify Perms: ${(performance.now() - pStart).toFixed(2)}ms`);
        } catch (error) {
            // If permission denied, render AccessDenied component
            // We need to import it dynamically or statically? Static is fine if it's client component
            const AccessDenied = (await import('@/components/AccessDenied')).default;
            return <AccessDenied tenantSlug={tenantSlug} requiredPermission={requiredPermissions.join(', ')} />;
        }
    }

    let matchParams: Record<string, string> = {};
    const route = matchedModule.routes.find(r => {
        const match = matchRoute(r.path, remainingPath);
        if (match.matches) {
            matchParams = match.params || {};
        }
        return match.matches;
    });

    if (!route) {
        console.warn(`[DynamicRouter] No route found in module ${matchedModule.id} for path ${remainingPath}`);
        notFound();
    }

    // 6. Render Component
    const Component = route.component as React.ComponentType<any>;

    return (
        <Component params={{ tenantSlug, slug, ...matchParams }} searchParams={{}} />
    );
}
