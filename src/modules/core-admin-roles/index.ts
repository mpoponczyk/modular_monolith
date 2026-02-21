
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const RolesApp: ModuleDefinition = {
    id: 'core-admin-roles',
    name: 'Roles',
    system: {
        isActive: true,
    },
    permissions: {
        requiredPermissions: ['roles.view'],
    },
    layout: {
        showInMenu: true,
        order: 20,
        menuGroup: 'System',
        icon: 'Shield',
    },
    routes: [
        {
            path: '',
            component: Page,
        }
    ],
    getTranslations: async (locale: string) => {
        try {
            return (await import(`./locales/${locale}.json`)).default;
        } catch {
            return null;
        }
    }
};
