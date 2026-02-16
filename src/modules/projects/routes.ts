// mateusz poponczyk
import { RouteDefinition } from '@/core/types';
import { ProjectList } from './ui/ProjectList';
import { ProjectDetails } from './ui/ProjectDetails';

export const routes: RouteDefinition[] = [
    {
        path: '/',
        component: ProjectList,
        name: 'Projects',
    },
    {
        path: '*',
        component: ProjectDetails,
    },
];
