
# Strict Empty App Audit Report(23 Apps)

**Date**: 2026-02-19
**Tenant**: 22a83baa-2246-4470-8b3c-f0bf1958aca4 (Test Tenant)
**Objective**: strictly audit why 23 visible apps return 404.

## 1. Global Finding: Systemic URL Mismatch
There is a **Critical Architecture Violation** regarding routing.
- **Menu Generation**: `src/core/menu/dynamic.ts` generates links as `/admin/${moduleId}`.
- **Physical Routes**: Located at `src/app/(admin)/admin/t/[tenantSlug]/apps/${moduleId}`.
- **Middleware**: `src/middleware.ts` does **NOT** rewrite `/admin/${moduleId}` to the physical path.
- **Result**: Users click `/admin/ferry-booking/routes`, Browser sends request, Next.js finds no route at `/admin/ferry-booking/routes`. **404**.

## 2. Strict Per-App Audit (Sequential)

| # | App ID | Registry | DB | Physical File (`apps/...`) | Error | Root Cause |
|---|---|---|---|---|---|---|
| 1 | `roles` | MISSING | PRESENT | MISSING | 404 | **Legacy Zombie** (Not in Registry, but in DB) |
| 2 | `settings` | MISSING | PRESENT | MISSING | 404 | **Legacy Zombie** (Not in Registry, but in DB) |
| 3 | `core-admin/users` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 4 | `core-admin/roles` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 5 | `core-admin/sessions` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 6 | `core-admin/settings` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 7 | `core-admin/cockpits` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 8 | `core-admin/planning` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 9 | `ferry-booking/ferries` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 10 | `ferry-booking/routes` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 11 | `ferry-booking/services` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 12 | `ferry-booking/reservations` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 13 | `ferry-planning/calendar` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 14 | `ferry-booking/orders` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 15 | `ferry-booking/invoices` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 16 | `crm/partners` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 17 | `ferry-pricing/profiles` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 18 | `ferry-reporting/manifests` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 19 | `ferry-reporting/sales` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 20 | `ferry-planning/gantt` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 21 | `ferry-planning/templates` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 22 | `ferry-booking/trips` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 23 | `ferry-pricing/routes` | PRESENT | PRESENT | EXISTS | 404 | **URL Mismatch** (Menu vs File) |
| 24 | `crm/customers` | PRESENT | PRESENT | **MISSING** | 404 | **Missing Implementation** (File not created) |
| 25 | `dashboard` | PRESENT | PRESENT | **MISSING** | 404 | **Missing Implementation** (Should be root dashboard?) |
| 26 | `core-admin` | PRESENT | PRESENT | **MISSING** | 404 | **Missing Implementation** (Container module) |

## 3. Classification
1.  **URL Mismatch (Pattern of Failure)**: 21/26 apps exist but are unreachable because `dynamic.ts` generates invalid URLs.
2.  **Missing Implementation**: `crm/customers`, `dashboard`, `core-admin` are registered but have no physical files in `apps/`.
3.  **Legacy Zombies**: `roles` and `settings` are in DB but not Registry.

## 4. Fix Strategy
The current state is a **Hybrid Violation**.
- **Violation**: "Admin modules must not be directly mounted as Next.js file-system routes" -> But `apps/` folder exists with static routes.
- **Violation**: "Admin routing must be dynamic" -> But no dynamic router (`[[...slug]]`) handles these modules.

### Proposal: Strict Architecture Convergence
1.  **Immediate Fix (Unblock)**: Update `src/core/menu/dynamic.ts` to generate links valid for the *current* (legacy) physical structure: `/admin/t/${tenantId}/apps/${moduleId}`.
    *   *Pros*: Instantly unblocks testing.
    *   *Cons*: Cements the "Physical Route" violation.
2.  **Architecture Fix (Correct)**: Implement the **Dynamic Router**.
    *   Create `src/app/(admin)/admin/t/[tenantSlug]/[...slug]/page.tsx`.
    *   Implement `ModuleRenderer` that takes `slug`, looks up Registry, and renders the Component.
    *   DELETE `src/app/.../apps` folder.
    *   Update `dynamic.ts` to point to `/admin/t/${tenantId}/${moduleId}`.

**Verdict**: Given the strict instruction "Follow .docs/architecture constraints", **Proposal 2 (Architecture Fix)** is the ONLY compliant path. The existence of `apps/` is a violation that must be remediated.
