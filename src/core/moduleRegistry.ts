/**
 * Module Registry
 * 
 * EXCLUSIVE SOURCE OF TRUTH for registered modules.
 * 
 * Rules:
 * 1. This is the ONLY file allowed to import from src/modules/*.
 * 2. Modules must be statically imported and added to the array.
 * 3. Removing a module requires removing the import here.
 */

import { ModuleDefinition } from './types';

// IMPORT MODULES HERE
import { ExampleDashboardModule } from '../modules/example-dashboard';

// REGISTER MODULES HERE
const registeredModules: ModuleDefinition[] = [
    ExampleDashboardModule,
];

export const moduleRegistry = {
    getModules: () => registeredModules,

    getModule: (id: string) => registeredModules.find(m => m.id === id),
};
