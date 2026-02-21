
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const ManifestsApp: ModuleDefinition = {
    id: 'ferry-reporting-manifests',
    name: 'Manifests',
    system: { isActive: true },
    permissions: { requiredPermissions: ['manifests.view'] },
    layout: {
        showInMenu: true,
        order: 5,
        menuGroup: 'Reporting',
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
