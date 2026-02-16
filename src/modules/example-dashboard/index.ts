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
    routes,
};
