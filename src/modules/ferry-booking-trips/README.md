# Module: `ferry-booking-trips`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-booking-trips. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-booking-trips`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-booking-trips`

## 3. Permissions
- **View**: `ferry-booking-trips.view`
- **Mutations**: `ferry-booking-trips.manage`
(Verify exact permission keys in `index.ts`)

## 4. Data model
- **Tables**: Refer to `sql/schema.sql`.
- **RPCs**: Security definer functions for mutations (if applicable).
- **Ownership**: Data is tenanted and governed by RLS.

## 5. RLS
- Enforced on all tables.
- `tenant_id` is matched against JWT payload (`app.tenant_id`).
- Policies ensure isolation between tenants.

## 6. UI parity notes
This captures the state of `ferry-booking/trips` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `TripsContent` component.
- **Props**: Receives structured records for `trips`, `routes`, `ferries`, and empty stubs for `partners`, `operationalStatuses`, `templates`, and `heatmapConfig` to satisfy legacy typings.
- **UI Elements**: Various modular components such as `TripDialog`, `DeleteTripButton`, `VisibilityToggle`, etc., to manage trip administration.

### 2. Action Surface
- Server Actions: `createTrip`, `updateTrip`, `deleteTrip`, `toggleTripVisibility`, `toggleOperationalStatus`.
- Includes stubs for currently unimplemented interactions: `applyTemplate`, `updateTripPrice`, `regenerateSchedule`.

### 3. CSS Tokens
- Layouts: Flexible grids and tab structures.

### 4. Permissions and RPC Usage
- **Permissions**: `trips.view` (page load) and `trips.manage` (writes).
- **Data Access**: `SupabaseTripRepository` (against `mnt_trips`), `SupabaseFerryRepository` (against `mnt_ferries`), and `SupabaseFerryRouteRepository` (against `mnt_routes`).

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
