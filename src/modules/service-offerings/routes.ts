import { RouteDefinition } from '@/core/types';
import { ServiceOfferingList } from './ui/ServiceOfferingList';
import { ServiceOfferingDetails } from './ui/ServiceOfferingDetails';

export const routes: RouteDefinition[] = [
    {
        path: '/',
        component: ServiceOfferingList,
        name: 'Service Offerings',
    },
    {
        path: '*',
        component: ServiceOfferingDetails,
    },
];
