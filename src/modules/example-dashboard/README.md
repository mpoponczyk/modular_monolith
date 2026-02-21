# Module: `example-dashboard`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for example-dashboard. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `example-dashboard`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/example-dashboard`

## 3. Permissions
- **View**: `example-dashboard.view`
- **Mutations**: `example-dashboard.manage`
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
Legacy blueprint has been migrated to strict UI parity.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
