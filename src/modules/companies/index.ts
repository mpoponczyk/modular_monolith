import { ModuleDefinition } from '@/core/types';
import { config } from './config';
import { permissions } from './permissions';
import { routes } from './routes';

export const CompaniesModule: ModuleDefinition = {
    ...config,
    permissions,
    routes,
};
