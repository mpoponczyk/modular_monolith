# Module: `ferry-booking-reservations`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-booking-reservations. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-booking-reservations`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-booking-reservations`

## 3. Permissions
- **View**: `ferry-booking-reservations.view`
- **Mutations**: `ferry-booking-reservations.manage`
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
This captures the strict 1:1 state of `ferry-booking/reservations` before isolation.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `ReservationsPage` with list/filters.
- **Components**: `CreateReservationDialog`, `ReservationFilters`, `ReservationsTable`, `EditReservationDialog`, `DeleteReservationButton`, `PaymentStatusBadge`.

### 2. Action Surface & Controllers
- **Server Actions**: `cancelReservationAction`, `createReservation`, `updateReservation`, `listReservationsAction`.
- Form data binding and revalidation of reservation routes.

### 3. Permissions & RPC Usage
- **Permissions**: Requires `reservations.view` and `reservations.manage`.
- **Data Layer**: Relies on `SupabaseReservationRepository` for primary management, but bypasses repository for dropdowns by directly querying `mnt_trips` and `mnt_routes` using a raw Supabase client inside the frontend.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
