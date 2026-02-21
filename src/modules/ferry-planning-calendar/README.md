# Module: `ferry-planning-calendar`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-planning-calendar. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-planning-calendar`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-planning-calendar`

## 3. Permissions
- **View**: `ferry-planning-calendar.view`
- **Mutations**: `ferry-planning-calendar.manage`
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
This captures the strict 1:1 state of `ferry-planning/calendar` before bounded context isolation.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `CalendarPage` initializing data loading over wide date bounds.
- **UI Elements**: Uses `ShipScheduleCalendar` standard view loaded dynamically.

### 2. Action Surface & Controllers
- **Server Actions**: `getCalendarTripsAction`, `createTrip`, `applyTemplate`, `updateTripPrice`, `regenerateSchedule`, `updateTrip`, `deleteTrip`, `toggleTripVisibility`, `toggleOperationalStatus`.
- These expose the core planning primitives specifically mapped for the calendar front-end.

### 3. Permissions & RPC Usage
- **Permissions**: Requires `planning.view` to resolve components and `planning.manage` for DML transactions.
- **Data Layer**: Powered internally by `SupabaseCalendarService`.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
