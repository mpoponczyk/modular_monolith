
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const CalendarApp: ModuleDefinition = {
    id: 'ferry-planning-calendar',
    name: 'Calendar',
    system: { isActive: true },
    permissions: { requiredPermissions: ['calendar.view'] },
    layout: {
        showInMenu: true,
        order: 5,
        menuGroup: 'Planning',
        icon: 'Calendar',
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
