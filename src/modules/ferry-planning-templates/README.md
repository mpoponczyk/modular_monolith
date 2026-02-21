# Module: `ferry-planning-templates`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-planning-templates. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-planning-templates`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-planning-templates`

## 3. Permissions
- **View**: `ferry-planning-templates.view`
- **Mutations**: `ferry-planning-templates.manage`
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
This captures the state of `ferry-planning/templates` before isolation.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `TemplatesPage`.
- **UI Elements**: Leverages the core framework template grid standard setup.

### 2. Action Surface & Controllers
- **Server Actions**: Handled dynamically using shared schema validations mapped loosely by `moduleRegistration`.

### 3. Permissions & RPC Usage
- **Permissions**: Requires explicitly scoped `planning.view` to resolve components.
- **Data Layer**: Anchors into `SupabaseTemplateRepository` and `SupabaseTemplateService` sequentially.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
