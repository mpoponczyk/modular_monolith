
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const SalesReportApp: ModuleDefinition = {
    id: 'ferry-reporting-sales',
    name: 'Sales Report',
    system: { isActive: true },
    permissions: { requiredPermissions: ['sales.view'] },
    layout: {
        showInMenu: true,
        order: 10,
        menuGroup: 'Reporting',
        icon: 'TrendingUp',
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
