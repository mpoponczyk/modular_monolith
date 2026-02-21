
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const ProfilesApp: ModuleDefinition = {
    id: 'ferry-pricing-profiles',
    name: 'Profiles',
    system: { isActive: true },
    permissions: { requiredPermissions: ['profiles.view'] },
    layout: {
        showInMenu: true,
        order: 5,
        menuGroup: 'Pricing',
        icon: 'Tag',
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
