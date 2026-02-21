import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const UsersApp: ModuleDefinition = {
    id: 'core-admin-users', // <--- Set to exact domain-appId
    name: 'Użytkownicy Techniczni',
    system: {
        isActive: true,
    },
    permissions: {
        requiredPermissions: ['users.view'],
    },
    layout: {
        showInMenu: true,
        order: 10,
        menuGroup: 'System',
        icon: 'Users',
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
