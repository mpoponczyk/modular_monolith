# Module: `core-admin-planning`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for core-admin-planning. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `core-admin-planning`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/core-admin-planning`

## 3. Permissions
- **View**: `core-admin-planning.view`
- **Mutations**: `core-admin-planning.manage`
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
This captures the state of `core-admin/planning` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: `div.p-6.max-w-6xl.mx-auto.space-y-8`
- **Heading Block**: `h1.text-2xl.font-bold` "System Planning"
- **Grid Layout**: `grid grid-cols-1 md:grid-cols-2 gap-8` splitting Maintenance and Announcements.
- **Maintenance Section**:
  - `bg-white rounded-lg shadow border p-6`
  - Heading with `Settings` icon (orange).
  - Empty state: "No scheduled maintenance."
  - List items: `border-l-4 border-orange-500 pl-3` formatting start/end times and descriptions.
- **Announcements Section**:
  - `bg-white rounded-lg shadow border p-6`
  - Heading with `AlertCircle` icon (blue).
  - Empty state: "No active announcements."
  - List items: `bg-blue-50 p-3 rounded` formatting start time and descriptions.

### 2. Action Surface
- Currently read-only display. No forms or mutation triggers in the UI.

### 3. CSS Tokens
- Containers: `bg-white rounded-lg shadow border p-6`
- Maintenance accents: `text-orange-500`, `border-orange-500`
- Announcement accents: `text-blue-500`, `bg-blue-50`, `text-blue-900`
- Timestamps: `text-xs text-gray-400`, `text-xs text-blue-400 mb-1`

### 4. Permissions and RPC Usage
- **Permissions**: `planning.view` (action), `planning.manage` (page).
- **Data Access**: `SupabasePlanningRepository` handles fetching items via `get_system_planning_items` RPC.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
