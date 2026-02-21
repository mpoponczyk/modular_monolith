# Module: `ferry-booking-orders`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-booking-orders. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-booking-orders`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-booking-orders`

## 3. Permissions
- **View**: `ferry-booking-orders.view`
- **Mutations**: `ferry-booking-orders.manage`
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
This captures the structural state of `ferry-booking/orders` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `OrdersPage` which orchestrates component hydration.
- **Localization**: Relies on a specific `i18n` dictionary mapping mapped sequentially over locale contexts.
- **UI Elements**: Leverages `OrdersTable` alongside the unified `AdminPageHeader` layout standard.

### 2. Action Surface & Controllers
- **Server Actions**: `listOrdersAction`, `getOrderDetailsAction`, `cancelOrderAction`, `getInvoicePdfAction`.
- Binds direct payload queries against Supabase through dedicated helper classes and dynamic backend triggers.

### 3. Permissions & RPC Usage
- **Permissions**: Enforces `orders.view` on component render and `orders.manage` on write requests.
- **Data Layer**: Powered explicitly by `SupabaseOrderRepository` combined with inline overrides natively for associated items like bookings and invoices through the frontend interface.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
