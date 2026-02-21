
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const InvoicesApp: ModuleDefinition = {
    id: 'ferry-booking-invoices',
    name: 'Invoices',
    system: { isActive: true },
    permissions: { requiredPermissions: ['invoices.view'] },
    layout: {
        showInMenu: true,
        order: 35,
        menuGroup: 'Sales',
        icon: 'FileText',
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
