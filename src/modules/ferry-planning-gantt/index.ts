
import { ModuleDefinition } from '@/core/types';
import Page from './ui/Page';

export const GanttApp: ModuleDefinition = {
    id: 'ferry-planning-gantt',
    name: 'Gantt',
    system: { isActive: true },
    permissions: { requiredPermissions: ['gantt.view'] },
    layout: {
        showInMenu: true,
        order: 15,
        menuGroup: 'Planning',
        icon: 'BarChart',
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
