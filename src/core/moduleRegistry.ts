// mateusz poponczyk
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


import { ReservationsApp } from '../modules/ferry-booking-reservations';
import { OrdersApp } from '../modules/ferry-booking-orders';
import { FerriesApp } from '../modules/ferry-booking-ferries';
import { ServicesApp } from '../modules/ferry-booking-services';
import { InvoicesApp } from '../modules/ferry-booking-invoices';
import { RoutesApp } from '../modules/ferry-booking-routes';
import { TripsApp } from '../modules/ferry-booking-trips';


import { CalendarApp } from '../modules/ferry-planning-calendar';
import { TemplatesApp } from '../modules/ferry-planning-templates';
import { GanttApp } from '../modules/ferry-planning-gantt';


import { ProfilesApp } from '../modules/ferry-pricing-profiles';
import { PricingRoutesApp } from '../modules/ferry-pricing-routes';

import { PartnersApp } from '../modules/crm-partners';
import { CustomersApp } from '../modules/crm-customers';

import { ManifestsApp } from '../modules/ferry-reporting-manifests';
import { SalesReportApp } from '../modules/ferry-reporting-sales';


import { UsersApp } from '../modules/core-admin-users';
import { RolesApp } from '../modules/core-admin-roles';
import { CockpitsApp } from '../modules/core-admin-cockpits';
import { SystemPlanningApp } from '../modules/core-admin-planning';
import { SessionsApp } from '../modules/core-admin-sessions';
import { SettingsApp } from '../modules/core-admin-settings';

// REGISTER MODULES HERE
const registeredModules: ModuleDefinition[] = [
    ExampleDashboardModule,

    FerriesApp,
    ServicesApp,
    TripsApp,
    ReservationsApp,

    OrdersApp,
    InvoicesApp,
    RoutesApp,

    CalendarApp,
    TemplatesApp,
    GanttApp,

    ProfilesApp,
    PricingRoutesApp,
    PartnersApp,
    CustomersApp,

    ManifestsApp,
    SalesReportApp,

    UsersApp,
    RolesApp,
    SessionsApp,
    SettingsApp,
    CockpitsApp,
    SystemPlanningApp,
];

export const moduleRegistry = {
    getModules: () => registeredModules,

    getModule: (id: string) => registeredModules.find(m => m.id === id),
};
