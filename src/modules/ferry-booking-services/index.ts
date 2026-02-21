
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const ServicesApp: ModuleDefinition = {
    id: 'ferry-booking-services',
    name: 'Services',
    system: { isActive: true },
    permissions: { requiredPermissions: ['services.view'] },
    layout: {
        showInMenu: true,
        order: 4,
        menuGroup: 'Logistics',
        icon: 'Briefcase',
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
