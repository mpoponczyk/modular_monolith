
import Page from './ui/Page';
import { ModuleDefinition } from '@/core/types';

export const PartnersApp: ModuleDefinition = {
    id: 'crm-partners',
    name: 'Partners',
    system: { isActive: true },
    permissions: { requiredPermissions: ['partners.view'] },
    layout: {
        showInMenu: true,
        order: 5,
        menuGroup: 'CRM',
        icon: 'Users',
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
