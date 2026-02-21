import { ModuleDefinition } from '@/core/types';

import Page from './ui/Page';

export const SessionsApp: ModuleDefinition = {
    id: 'core-admin-sessions',
    name: 'Sessions',
    system: {
        isActive: true,
    },
    permissions: {
        requiredPermissions: ['security.view'],
    },
    layout: {
        showInMenu: true,
        order: 30,
        menuGroup: 'System',
        icon: 'Lock',
    },
    routes: [
        {
            path: '/',
            name: 'Sessions',
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
