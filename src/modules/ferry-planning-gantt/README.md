# Module: `ferry-planning-gantt`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-planning-gantt. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-planning-gantt`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-planning-gantt`

## 3. Permissions
- **View**: `ferry-planning-gantt.view`
- **Mutations**: `ferry-planning-gantt.manage`
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
This captures the state of `ferry-planning/gantt` before strict 1:1 module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `GanttPage`. Subscribes to time-series route bounds.
- **UI Elements**: Orchestrates the core Gantt rendering components locally.

### 2. Action Surface & Controllers
- **Server Actions**: Shares data retrieval actions with Calendar but organizes responses into timeline clusters.

### 3. Permissions & RPC Usage
- **Permissions**: Requires `planning.view` for reads and `planning.manage` for edits natively.
- **Data Layer**: Powered internally by `SupabaseGanttService` and an inherited duplication of `SupabaseCalendarService` strictly scoped to this module boundary to prevent cross-contamination.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
