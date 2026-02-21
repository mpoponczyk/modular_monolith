# Module: `core-admin-sessions`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for core-admin-sessions. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `core-admin-sessions`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/core-admin-sessions`

## 3. Permissions
- **View**: `core-admin-sessions.view`
- **Mutations**: `core-admin-sessions.manage`
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
This captures the state of `core-admin/sessions` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: `div.space-y-6`
- **Breadcrumb**: `flex items-center gap-2 text-sm text-slate-500 mb-2`
- **Heading Block**: `AdminPageHeader` rendering title "Sesje".
- **Table**: `SessionTable` component displaying active sessions, device info, session type (trusted/temporary), and last heartbeat.

### 2. Action Surface
- `getSessionsAction` to populate the table.
- Revoke Session button/action inside the table (likely a trash bin or "Wyloguj" button).

### 3. CSS Tokens
- Layout: `space-y-6`, `flex items-center gap-2`
- Breadcrumb: `text-sm text-slate-500`, `hover:text-blue-600 transition-colors`

### 4. Permissions and RPC Usage
- **Permissions**: `security.view` (in `Page.tsx`).
- **Data Access**: `auth_trusted_devices` and `auth_sessions_view` via Supabase repository. The module directly owns `auth_trusted_devices` table.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
