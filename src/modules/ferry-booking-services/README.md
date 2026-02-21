# Module: `ferry-booking-services`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-booking-services. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-booking-services`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-booking-services`

## 3. Permissions
- **View**: `ferry-booking-services.view`
- **Mutations**: `ferry-booking-services.manage`
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
This captures the strict 1:1 state of `ferry-booking/services` before isolation.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `ServicesPage` orchestrating the localized grid payload.
- **Localization**: Relies on specific `i18n` `.json` dictionary assets tied dynamically to `getLocaleFromCookies()`.
- **UI Elements**: Uses `ServiceList` bound directly into the standard `AdminPageHeader`.

### 2. Action Surface & Controllers
- **Server Actions**: `getServicesAction`, `upsertServiceAction`, `deleteServiceAction`.
- The actions trigger downstream cache revalidations strictly tied to the tenant bounds.

### 3. Permissions & RPC Usage
- **Permissions**: Requires `services.view` to resolve components and `services.manage` for DML transactions.
- **Data Layer**: Powered internally by `SupabaseServiceRepository` bridging CRUD operations explicitly.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
