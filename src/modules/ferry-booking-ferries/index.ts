import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';
import FerryDetailsPage from './ui/FerryDetailsPage';

export const FerriesApp: ModuleDefinition = {
    id: 'ferry-booking-ferries',
    name: 'Ferries',
    system: { isActive: true },
    permissions: { requiredPermissions: ['ferries.view'] },
    layout: {
        showInMenu: true,
        order: 5,
        menuGroup: 'Logistics',
        icon: 'Anchor',
    },
    routes: [

        {
            path: '',
            component: Page,
        },
        {
            path: '[id]',
            component: FerryDetailsPage,
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
