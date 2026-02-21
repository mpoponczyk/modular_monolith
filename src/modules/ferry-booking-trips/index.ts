import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const TripsApp: ModuleDefinition = {
    id: 'ferry-booking-trips',
    name: 'Trips',
    system: { isActive: true },
    permissions: { requiredPermissions: ['trips.view'] },
    layout: {
        showInMenu: true,
        order: 10,
        menuGroup: 'Sales',
        icon: 'Map',
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
}; // Handled by Next.js App Router
