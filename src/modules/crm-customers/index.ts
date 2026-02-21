import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const CustomersApp: ModuleDefinition = {
    id: 'crm-customers',
    name: 'Customers',
    system: { isActive: true },
    permissions: { requiredPermissions: ['customers.view'] },
    layout: {
        showInMenu: true,
        order: 10,
        menuGroup: 'CRM',
        icon: 'UserCheck',
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
