
# Detailed App Inventory & Migration Matrix

**Date**: 2026-02-19
**Objective**: Stabilize UI Architecture. Compare Source (A) vs Target (B).

## Legend
- **Source (A)**: `src/app/(admin)/admin/t/[tenantSlug]/apps/<appId>`
- **Target (B)**: `src/modules/<module>/<app>`
- **UI**: Components/Pages.
- **Actions**: Server Actions.
- **Repos**: Data Access.

## Strict Inventory Matrix

| App ID | Source (A) | Target (B) | Divergence | UI Loc | Actions Loc | Truth | Recommended Action |
|---|---|---|---|---|---|---|---|
| `dashboard` | NO | NO | NO | NONE | NONE | MISSING | Implement Fresh |
| `ferry-booking` | NO | YES | NO | B | B | B | Dynamic Router |
| `ferry-booking/ferries` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |
| `ferry-booking/services` | YES | YES | YES | A | NONE | SPLIT | Merge UI -> B |
| `ferry-booking/trips` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `ferry-booking/reservations` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `ferry-booking/orders` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `ferry-booking/invoices` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |
| `ferry-booking/routes` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `ferry-planning` | NO | YES | NO | B | B | B | Dynamic Router |
| `ferry-planning/calendar` | YES | YES | YES | A | NONE | SPLIT | Merge UI -> B |
| `ferry-planning/templates` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `ferry-planning/gantt` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `ferry-pricing` | NO | YES | NO | B | B | B | Dynamic Router |
| `ferry-pricing/profiles` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `ferry-pricing/routes` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `crm` | NO | YES | NO | B | B | B | Dynamic Router |
| `crm/partners` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `crm/customers` | NO | YES | NO | B | B | B | Dynamic Router |
| `ferry-reporting` | NO | YES | NO | B | B | B | Dynamic Router |
| `ferry-reporting/manifests` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |
| `ferry-reporting/sales` | YES | YES | YES | A | A | SPLIT | Move All -> B |
| `core-admin` | NO | YES | NO | B | B | B | Dynamic Router |
| `core-admin/users` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |
| `core-admin/roles` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |
| `core-admin/sessions` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |
| `core-admin/settings` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |
| `core-admin/cockpits` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |
| `core-admin/planning` | YES | YES | YES | A | B | SPLIT | Merge UI -> B |

## Analysis
- **Split State (18 Apps)**: Most core apps have their UI in Source (A) and their Logic/Repo in Target (B).
    - **Risk**: High. The UI code in A might contain inline logic that belongs in B.
    - **Strategy**: Move UI from A to B. Ensure B exports a clean `Page` component.
- **Target Only (8 Apps)**: These seem correctly strictly implemented, but have no Source route to expose them.
    - **Strategy**: `[...slug]` Dynamic Router will solve this.
- **Missing (1 App)**: `dashboard` needs implementation.

## Migration Order (Proposed)
1.  **Core Admin** (Users, Roles, Sessions...): Merge UI -> B.
2.  **Ferry Booking** (Ferries, Routes...): Merge UI -> B.
3.  **Ferry Planning** (Calendar, Gantt...): Merge UI -> B.
4.  **Ferry Pricing / Reporting / CRM**: Merge UI -> B.
5.  **Dynamic Router**: Activate.
6.  **Cleanup**: Delete Source (A).
