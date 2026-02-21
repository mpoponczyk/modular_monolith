// mateusz poponczyk
/**
 * Example Dashboard Module
 * 
 * Exports ModuleDefinition.
 */

import { ModuleDefinition } from '@/core/types';
import { config } from './config';
import { permissions } from './permissions';
import { routes } from './routes';

export const ExampleDashboardModule: ModuleDefinition = {
    ...config,
    permissions,
    routes: routes,
    getTranslations: async (locale: string) => {
        try {
            return (await import(`./locales/${locale}.json`)).default;
        } catch {
            return null;
        }
    }
};
