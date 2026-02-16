// mateusz poponczyk
/**
 * RBAC Logic for Module Access
 * 
 * Determines if a user can access a module based on roles.
 */

import { ModuleDefinition, UserContext } from './types';

export function canAccessModule(module: ModuleDefinition, context: UserContext): boolean {
    // 1. If no permissions are required, it's public (to admin users)
    if (!module.permissions.requiredPermissions || module.permissions.requiredPermissions.length === 0) {
        return true;
    }

    // 2. Check for Wildcard '*' (Superuser within Tenant)
    if (context.permissions.includes('*')) {
        return true;
    }

    // 3. Check overlap between user permissions and required permissions
    return module.permissions.requiredPermissions.some(permission => context.permissions.includes(permission));
}
