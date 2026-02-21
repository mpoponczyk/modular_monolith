# Module: `ferry-booking-routes`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-booking-routes. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-booking-routes`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-booking-routes`

## 3. Permissions
- **View**: `ferry-booking-routes.view`
- **Mutations**: `ferry-booking-routes.manage`
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
This captures the state of `ferry-booking/routes` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: `div.space-y-6`
- **Heading Block**: `AdminPageHeader` driving the title/subtitle.
- **Table Structure**: `Table` listing Connections (`origin` -> `destination`), Default Ship, Est. Duration, Standard (active toggles), and Actions.
- **Row Displays**: `Ship` icon mapping to assigned default ships, Origin/Destination locations styled as nested badges (`bg-blue-100`/`bg-green-100`).

### 2. Action Surface
- Server Actions: `createRouteAction`, `updateRouteAction`, `updateRouteStatusAction`, `deleteRouteAction`.
- Interactions: `RouteDialog` form for mutations, `DeleteRouteButton` for removals, and `StandardToggle` for quick status flips.

### 3. CSS Tokens
- Containers: `border rounded-lg bg-white overflow-hidden shadow-sm`
- Connection Badges: `px-2 py-0.5 rounded text-xs` (blue/green variants)
- Null States: `text-xs text-gray-400`

### 4. Permissions and RPC Usage
- **Permissions**: `routes.view` for read requests, `routes.manage` for writes.
- **Data Access**: `FerryBookingService` orchestrating the `SupabaseFerryRouteRepository` against `ferry_routes` and lookup tables (`ferry_locations`, `ferries`).

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
