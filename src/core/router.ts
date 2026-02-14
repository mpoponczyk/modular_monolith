/**
 * Admin Router Logic
 * 
 * Resolves URL slugs to Module and Route definitions.
 * 
 * Rules:
 * 1. Relies ONLY on moduleRegistry.
 * 2. Does NOT handle activation or permissions (separation of concerns).
 * 3. Handles root paths and wildcards.
 */

import { moduleRegistry } from './moduleRegistry';
import { ModuleDefinition, RouteDefinition } from './types';

type RouteMatch = {
    module: ModuleDefinition;
    route: RouteDefinition;
};

export function resolveRoute(slug?: string[]): RouteMatch | null {
    // 1. Handle Root /admin Case
    // If slug is undefined or empty, we are at /admin
    if (!slug || slug.length === 0) {
        // Current strategy: Return null.
        // The page.tsx handles this (e.g. redirect to dashboard or 404).
        return null;
    }

    const [moduleId, ...rest] = slug;

    // 2. Lookup Module
    const module = moduleRegistry.getModule(moduleId);
    if (!module) return null;

    // 3. Resolve Path
    // If no remaining segments, we are at /admin/<moduleId> -> maps to "/"
    const path = rest.length === 0 ? '/' : `/${rest.join('/')}`;

    // 4. Find Route Match
    // Priority: Exact Match > Wildcard Match
    const route = module.routes.find(r => r.path === path) ||
        module.routes.find(r => r.path === '*' && path !== '/');

    if (!route) return null;

    return { module, route };
}
