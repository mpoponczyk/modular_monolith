
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const CockpitsApp: ModuleDefinition = {
    id: 'core-admin-cockpits',
    name: 'Cockpits',
    system: { isActive: true },
    permissions: { requiredPermissions: ['cockpits.view'] },
    layout: {
        showInMenu: true,
        order: 40,
        menuGroup: 'System',
        icon: 'LayoutDashboard',
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
