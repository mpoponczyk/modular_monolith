
import Page from './ui/Page';
import { ModuleDefinition } from '@/core/types';

export const TemplatesApp: ModuleDefinition = {
    id: 'ferry-planning-templates',
    name: 'Templates',
    system: { isActive: true },
    permissions: { requiredPermissions: ['templates.view'] },
    layout: {
        showInMenu: true,
        order: 10,
        menuGroup: 'Planning',
        icon: 'Layout',
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
