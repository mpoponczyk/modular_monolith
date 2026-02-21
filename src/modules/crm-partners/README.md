# Module: `crm-partners`

## 1. Purpose
This module encapsulates the domain, application logic, and presentation layer for crm-partners. It maintains strict isolation as part of the modular monolith architecture.

## 2. Entry routes
- Router: Mounted dynamically via `moduleRegistry.ts`.
- App ID: `crm-partners`
- Typical URL: `/admin/t/[tenantSlug]/(dashboard)/apps/crm-partners`

## 3. Permissions
- **View**: `crm-partners.view`
- **Mutations**: `crm-partners.manage`
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
This captures the state of `crm/partners` before strict module extraction.

### 1. UI DOM Structure & Key Components
- **Page Container**: `div.p-6` wrapping `PartnersContent` and `div.space-y-6`.
- **Heading Block**: `h2.text-2xl.font-bold` "Partnerzy Biznesowi"
- **Filter Tabs**: `Tabs` component creating query-param driven filters (`?type=SELLER`, `?type=BUYER`, `?type=ALL`).
- **Data Table**: Displays `Nazwa Partnera`, `Typ`, `NIP`, `Lokalizacja`, and `Akcje`.
- **Row Displays**: Uses `Badge` for types, `Building2` and `Mail` icons for layout.

### 2. Action Surface
- Data Load: `listPartnersAction` in `Page.tsx` filtering in-memory via `activeFilter`.
- Mutations: `createPartnerAction`, `updatePartnerAction`, and `deletePartnerAction`.
- Forms: Uses `PartnerForm` modal for both creation and editing.
- Deletion: Direct inline form submission triggering `deletePartnerAction`.

### 3. CSS Tokens
- Layouts: `space-y-6`
- Empty States: `text-center py-12 text-slate-500`
- Colors: standard `text-slate-500`, `bg-red-50 text-red-600` for errors.

### 4. Permissions and RPC Usage
- **Permissions**: `crm.view` required for page access, but actions specifically check `partners.view` and `partners.manage`.
- **Data Access**: `SupabasePartnerRepository` executing standard Supabase client operations against `crm_partners`.

## 7. How to run/verify
- **Manual steps**: Navigate to the module via the admin dashboard menu. Verify CRUD operations.
- **Test notes**: Ensure no cross-tenant data bleed. Verify build passes without trailing legacy aliases.

## 8. Known risks/tech debt
- Ensure UI components strictly invoke Server Actions rather than querying the DB directly (requires ongoing sweeps).
