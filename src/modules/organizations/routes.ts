import { RouteDefinition } from '@/core/types';
import { OrganizationList } from './ui/OrganizationList';

export const routes: RouteDefinition[] = [
    {
        path: '/',
        component: OrganizationList,
        name: 'Organizations',
    },
];
