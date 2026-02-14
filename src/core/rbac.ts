/**
 * RBAC Logic for Module Access
 * 
 * Determines if a user can access a module based on roles.
 */

import { ModuleDefinition, UserContext } from './types';

export function canAccessModule(module: ModuleDefinition, context: UserContext): boolean {
    // 1. If no roles are required, it's public (to admin users)
    if (!module.permissions.requiredRoles || module.permissions.requiredRoles.length === 0) {
        return true;
    }

    // 2. Check overlap between user roles and required roles
    return module.permissions.requiredRoles.some(role => context.roles.includes(role));
}
