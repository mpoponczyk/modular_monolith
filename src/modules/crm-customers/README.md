# Module: `crm-customers`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for crm-customers. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `crm-customers`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/crm-customers`

## 3. Permissions
- **View**: `crm-customers.view`
- **Mutations**: `crm-customers.manage`
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
This captures the state of `crm/customers` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: `div.p-6.h-full.flex.flex-col`
- **Heading Block**: `h2.text-2xl.font-bold.tracking-tight` "Klienci"
- **Card**: Standard `Card` > `CardHeader` > `CardTitle` & `CardDescription`.
- **Empty State**: `div.text-center.py-12.text-slate-500.bg-slate-50.rounded-lg.border.border-dashed` "Brak dodanych klientów w systemie."
- **List View**: `div.space-y-4` containing items `div.p-4.border.rounded-lg.flex.justify-between.items-center`.

### 2. Action Surface
- Server Action: `listCustomersAction` powers the list.
- Note: `actions.ts` provides create/update/delete actions, but current UI does not wire them up yet.

### 3. CSS Tokens
- Containers: `bg-slate-50 rounded-lg border border-dashed`
- Typography: `font-semibold`, `text-sm text-slate-500`

### 4. Permissions and RPC Usage
- **Permissions**: `crm.view` to access page, `crm.manage` to mutate.
- **Data Access**: `SupabaseCustomerRepository` querying `crm_customers` directly by tenant.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
