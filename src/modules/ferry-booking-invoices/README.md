# Module: `ferry-booking-invoices`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for ferry-booking-invoices. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `ferry-booking-invoices`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/ferry-booking-invoices`

## 3. Permissions
- **View**: `ferry-booking-invoices.view`
- **Mutations**: `ferry-booking-invoices.manage`
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
This captures the state of `ferry-booking/invoices` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: Rendered by `InvoicesPage`.
- **Localization**: Uses Local Module Dictionary `i18n` for UI language binding.
- **UI Elements**: `AdminPageHeader` and `InvoicesList`. Contains custom logic for mocking invoice variables based on deeply nested reservations queries (which should eventually move fully to the infrastructure repository AST mapper).

### 2. Action Surface & Controllers
- **Server Actions**: `getInvoicesAction`, `generateInvoiceHtmlAction`, `downloadInvoicePdfAction`.
- The actions generate raw PDFs dynamically.

### 3. Permissions & RPC Usage
- **Permissions**: Requires `invoices.view`.
- **Data Layer**: Self-contained `SupabaseInvoiceRepository` directly inside its local infrastructure folder originally.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
