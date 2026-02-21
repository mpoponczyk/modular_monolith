# Deleting the `ferry-booking-services` module

To completely remove this module from the Strict Modular Monolith architecture, perform the following steps:

1.  **Remove Registration:** Delete the module's entry strictly from `src/core/moduleRegistry.ts`.
2.  **Database Cleanup:** Drop all specific tables and enums listed in `sql/schema.sql` within the database.
3.  **Delete Files:** Remove the entire `src/modules/ferry-booking-services` directory.
4.  **UI/Routes Removal:** Any legacy dynamic routes mapping to this module should gracefully 404.
