
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const OrdersApp: ModuleDefinition = {
    id: 'ferry-booking-orders',
    name: 'Orders',
    system: { isActive: true },
    permissions: { requiredPermissions: ['orders.view'] },
    layout: {
        showInMenu: true,
        order: 30,
        menuGroup: 'Sales',
        icon: 'ShoppingCart',
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
