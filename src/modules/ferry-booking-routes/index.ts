
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const RoutesApp: ModuleDefinition = {
    id: 'ferry-booking-routes',
    name: 'Routes',
    system: { isActive: true },
    permissions: { requiredPermissions: ['routes.view'] },
    layout: {
        showInMenu: true,
        order: 3,
        menuGroup: 'Logistics',
        icon: 'MapPin',
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
