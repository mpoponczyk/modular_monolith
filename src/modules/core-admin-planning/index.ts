
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const SystemPlanningApp: ModuleDefinition = {
    id: 'core-admin-planning',
    name: 'System Planning',
    system: { isActive: true },
    permissions: { requiredPermissions: ['planning.view'] },
    layout: {
        showInMenu: true,
        order: 50,
        menuGroup: 'System',
        icon: 'Calendar',
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
