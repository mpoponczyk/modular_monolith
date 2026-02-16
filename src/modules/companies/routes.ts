import { RouteDefinition } from '@/core/types';
import { CompanyList } from './ui/CompanyList';
import { CompanyDetails } from './ui/CompanyDetails';

export const routes: RouteDefinition[] = [
    {
        path: '/',
        component: CompanyList,
        name: 'Companies',
    },
    {
        path: '*',
        component: CompanyDetails,
    },
];
