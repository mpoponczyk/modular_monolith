import { RouteDefinition } from '@/core/types';
import { DashboardComponent } from './ui/Dashboard';

export const routes: RouteDefinition[] = [
    {
        path: '/',
        component: DashboardComponent,
        name: 'Dashboard',
    },
];
