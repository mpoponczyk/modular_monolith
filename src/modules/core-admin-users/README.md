# Module: `core-admin-users`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for core-admin-users. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `core-admin-users`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/core-admin-users`

## 3. Permissions
- **View**: `core-admin-users.view`
- **Mutations**: `core-admin-users.manage`
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
This snapshot captures the exact state of the `core-admin/users` app before its strict extraction to ensure 1:1 parity is maintained.

### 1. UI DOM Structure & Key Components
- **Container**: `div.space-y-4`
- **Header Action**: `div.flex.justify-end` containing Add User Button.
- **Table**: `div.bg-white.border.rounded-xl.shadow-sm.overflow-hidden` wrapped `table.w-full.text-left`.
- **Columns**: Użytkownik / Login, Dane Kontaktowe, Status, Rola, Akcje.
- **Modals**: 
  - `Dialog` for "Dodaj/Edytuj Użytkownika".
- **Icons utilized**: `User`, `Lock`, `Unlock`, `Key`, `Pencil`, `Trash2`, `Plus`, `Star`, `ShieldAlert`.

### 2. Action Surface (Buttons, Dialogs, Modals)
- **Buttons (Row Level)**:
  - Unlock (Red to Emerald hover, `Lock` icon) / Lock (Emerald to Red hover, `Unlock` icon)
  - Reset Password (`Key` icon)
  - Edit (`Pencil` icon)
  - Delete (`Trash2` icon)

### 3. CSS Tokens Used (Tailwind)
- `bg-blue-600 hover:bg-blue-700`, `bg-white border rounded-xl shadow-sm overflow-hidden`
- `px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider`
- Status pill tokens: `bg-red-100 text-red-700 border-red-200`, `bg-emerald-100 text-emerald-700 border-emerald-200`, `bg-slate-100 text-slate-600 border-slate-200`.

### 4. Permissions and RPC Usage
- **Permissions**:
  - `users.view`: Read profiles and roles.
  - `users.manage`: Create, Update, Delete, Lock, Unlock, Reset Password.
- **DB Objects / Tables**:
  - `admin_profiles`
  - `admin_roles`
  - `tenant_users`
  - Auth interactions (`auth.admin.generateLink`, `updateUserById`, `deleteUser`, `signOut`)
  - Deletes from `auth_trusted_devices` on lock/reset.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
