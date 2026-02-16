// mateusz poponczyk
import { moduleRegistry } from './moduleRegistry';
import { isModuleActive } from './activation';
import { TenantContext, UserContext } from './types';
import { canAccessModule } from './rbac';

export interface MenuItem {
    id: string;
    name: string;
    path: string;
    order: number;
    group?: string;
}

export function getMenuItems(tenantContext: TenantContext, userContext: UserContext): MenuItem[] {
    const modules = moduleRegistry.getModules();

    return modules
        .filter(m => isModuleActive(m, tenantContext))
        .filter(m => canAccessModule(m, userContext))
        .filter(m => m.layout.showInMenu)
        .map(m => ({
            id: m.id,
            name: m.name,
            path: `/admin/${m.id}`,
            order: m.layout.order,
            group: m.layout.menuGroup,
        }))
        .sort((a, b) => a.order - b.order);
}
