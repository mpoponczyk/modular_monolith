# Module: `core-admin-cockpits`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for core-admin-cockpits. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `core-admin-cockpits`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/core-admin-cockpits`

## 3. Permissions
- **View**: `core-admin-cockpits.view`
- **Mutations**: `core-admin-cockpits.manage`
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
This captures the state of `core-admin/cockpits` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: `div.p-6.max-w-6xl.mx-auto`
- **Heading Block**: `h1.text-2xl.font-bold.mb-6` "Cockpit Painter"
- **Manager Component**: `CockpitManager` toggles between list view and edit view.
- **List View**: Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`. Uses `Layout` icon in blue container. Exposes Edit/Delete icons on hover.
- **Edit View**: "New Cockpit"/"Edit Cockpit" heading, basic text input for Name, and a JSON `textarea` config editor. Also includes a crude preview grid visualizing layout.

### 2. Action Surface
- "New Cockpit" button
- Hover actions on cards: "Edit" and "Delete" (with confirm).
- Save/Cancel buttons in edit view.

### 3. CSS Tokens
- Containers: `bg-white rounded-lg shadow border p-6`
- Buttons: `bg-blue-600 text-white hover:bg-blue-700`
- Preview Grid elements: `bg-blue-100 border border-blue-300 text-blue-800`

### 4. Permissions and RPC Usage
- **Permissions**: `cockpits.manage` (required to view list, create, edit, delete).
- **Data Access**: `SupabaseCockpitRepository` handles `admin_cockpits` CRUD via RPCs or direct DB mutations.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
