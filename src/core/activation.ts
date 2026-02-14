/**
 * Module Activation Logic
 * 
 * Determines if a module is active for a given context.
 * 
 * Rules:
 * 1. system.isActive is a HARD SWITCH. If false, module is disabled.
 * 2. TenantContext.activeModuleIds is an ALLOW-LIST.
 *    - If empty: ALL system-active modules are enabled.
 *    - If not empty: ONLY listed modules are enabled.
 */

import { ModuleDefinition, TenantContext } from './types';

export function isModuleActive(module: ModuleDefinition, context: TenantContext): boolean {
    // 1. Check Global Hard Switch
    if (!module.system.isActive) {
        return false;
    }

    // 2. Check Tenant Configuration (Allow-List)
    // If the list has entries, we must check against it.
    // If the list is empty, we assume implicit "allow all" (subject to system.isActive).
    if (context.activeModuleIds.length > 0) {
        if (!context.activeModuleIds.includes(module.id)) {
            return false;
        }
    }

    return true;
}
