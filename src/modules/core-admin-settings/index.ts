
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const SettingsApp: ModuleDefinition = {
    id: 'core-admin-settings',
    name: 'Settings',
    system: { isActive: true },
    permissions: { requiredPermissions: ['settings.view'] },
    layout: {
        showInMenu: true,
        order: 30,
        menuGroup: 'System',
        icon: 'Settings',
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
