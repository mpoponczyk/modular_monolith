
import Page from './ui/Page';
import { ModuleDefinition } from '@/core/types';

export const PricingRoutesApp: ModuleDefinition = {
    id: 'ferry-pricing-routes',
    name: 'Pricing Routes',
    system: { isActive: true },
    permissions: { requiredPermissions: ['pricing_routes.view'] },
    layout: {
        showInMenu: true,
        order: 10,
        menuGroup: 'Pricing',
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
};
