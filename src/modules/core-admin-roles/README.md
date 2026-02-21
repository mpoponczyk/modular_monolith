# Module: `core-admin-roles`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for core-admin-roles. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `core-admin-roles`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/core-admin-roles`

## 3. Permissions
- **View**: `core-admin-roles.view`
- **Mutations**: `core-admin-roles.manage`
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
This snapshot captures the state of `core-admin/roles` prior to extraction.

### 1. UI DOM Structure & Key Components
- **Container**: Grid layout `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.
- **Cards**: `Card` component for each role `hover:shadow-md transition-shadow border-slate-200`.
- **Top Actions**: `flex justify-end` holding the Add Role button.
- **Card Content**: Edit/Delete icons in top right, role name, description, and list of pill-shaped accessible apps.
- **Form Dialog**: Contains Name, Description (Textarea), and a Checkbox grid for assigning applications.

### 2. Action Surface
- "Create New Role" Button (`Plus` icon).
- "Edit" icon button (`Pencil` icon).
- "Delete" icon button (`Trash2` icon) with spinning loader.
- Role Form with save state loader.

### 3. CSS Tokens
- Buttons: `bg-blue-600 hover:bg-blue-700`
- Badges: `bg-slate-100 text-slate-700`, `text-green-600` (check icon).
- Card icons: `bg-blue-50 text-blue-600` (shield icon).

### 4. Permissions and RPC Usage
- **Permissions**:
  - `roles.view`: Reading role lists and permissions.
  - `roles.manage`: Create, update, delete roles and their permissions.
- **Data Access**: Everything goes through `SupabaseRoleRepository` (RPCs/Tables: `admin_roles`, `admin_role_apps`).

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
