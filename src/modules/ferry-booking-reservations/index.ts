
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const ReservationsApp: ModuleDefinition = {
    id: 'ferry-booking-reservations',
    name: 'Reservations',
    system: { isActive: true },
    permissions: { requiredPermissions: ['reservations.view'] },
    layout: {
        showInMenu: true,
        order: 20,
        menuGroup: 'Sales',
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
