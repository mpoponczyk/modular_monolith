# Module: `ferry-booking-ferries`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-booking-ferries. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-booking-ferries`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-booking-ferries`

## 3. Permissions
- **View**: `ferry-booking-ferries.view`
- **Mutations**: `ferry-booking-ferries.manage`
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
This captures the state of `ferry-booking/ferries` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `FerriesPage` calling `FerriesList`.
- **Localization**: Uses Local Module Dictionary `i18n` for language binding.
- **UI Elements**: `FerriesList` and downstream presentation primitives.

### 2. Action Surface & Controllers
- **Server Actions**: `listFerriesAction`, `createFerryAction`, `updateFerryAction`, `deleteFerryAction`, `toggleFerryStatusAction`, `addZoneAction`, `deleteZoneAction`.
- Form data binding and revalidation of ferry routes.

### 3. Permissions & RPC Usage
- **Permissions**: Requires `ferries.view` and `ferries.manage`.
- **Data Layer**: Relies on `SupabaseFerryRepository` for base ferry CRUD. Zone operations bypass Repo entirely and use inline Supabase clients against `mnt_ferry_zones`.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
