# Module: `ferry-reporting-sales`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-reporting-sales. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-reporting-sales`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-reporting-sales`

## 3. Permissions
- **View**: `ferry-reporting-sales.view`
- **Mutations**: `ferry-reporting-sales.manage`
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
This captures the strict 1:1 legacy state of `ferry-reporting/sales` before bounds isolation.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `SalesPage`.
- **UI Elements**: Displays the daily net performance via robust data visualization dashboards alongside aggregated filtering options over distinct routes or temporal zones.

### 2. Action Surface & Controllers
- **Server Actions**: Direct access proxies querying daily aggregation mechanisms.

### 3. Permissions & RPC Usage
- **Permissions**: Scope validated against `reporting.view`.
- **Data Layer**: Driven entirely by `SupabaseSalesService`.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
