# Module: `core-admin-settings`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for core-admin-settings. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `core-admin-settings`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/core-admin-settings`

## 3. Permissions
- **View**: `core-admin-settings.view`
- **Mutations**: `core-admin-settings.manage`
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
This captures the state of `core-admin/settings` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: `div.max-w-2xl.mx-auto.space-y-6`
- **Breadcrumb**: `flex items-center gap-2 text-sm text-slate-500 mb-2`
- **Heading Block**: `flex items-center justify-between` wrapping title.
- **Children**: Integrates `SettingsUI` which handles sub-sections (Email Config, Timezone, Heatmap).

### 2. Action Surface
- SettingsUI handles modifications.

### 3. CSS Tokens
- Containers: `max-w-2xl mx-auto space-y-6`
- Text: `text-3xl font-bold tracking-tight text-slate-900`
- Links: `hover:text-blue-600 transition-colors`

### 4. Permissions and RPC Usage
- **Permissions**: `settings.view` (load page), `settings.manage` (save changes).
- **Data Access**: `SupabaseSettingsRepository` handles fetching/updating `sys_settings` for the tenant.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
