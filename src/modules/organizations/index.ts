// mateusz poponczyk
import { ModuleDefinition } from '@/core/types';
import { config } from './config';
import { permissions } from './permissions';
import { routes } from './routes';

export const OrganizationsModule: ModuleDefinition = {
    ...config,
    permissions,
    routes,
};
