

import { ModuleDefinition, UserContext } from '../types';

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
    // STRICT: AND logic enforced (User must have ALL required permissions)
    return module.permissions.requiredPermissions.every(permission => context.permissions.includes(permission));
}
