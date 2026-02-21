
# Strict Application Visibility Audit & Remediation

**Date:** 2026-02-18
**Tenant:** 22a83baa-2246-4470-8b3c-f0bf1958aca4 (Test Tenant)

## 1. Problem
User reported only 6 applications visible in the Library, while 23+ should be active.
Audit revealed:
- **Registry:** 29 apps registered.
- **DB Active:** 20 apps mapped to sections initially.
- **UI Logic:** Was using valid static `moduleRegistry` definitions but ignoring DB section mappings for some apps, or relying on `showInMenu` flags that were inconsistent with DB state.
- **Root Cause:** The `AppLibraryPage` was using a static `getMenuItems` function that relied solely on the code registry, ignoring the `organization_section_items` table which allows dynamic grouping and visibility control.

## 2. Analysis
- **Missing Apps:** `dashboard`, `core-admin`, `crm/customers`, `ferry-pricing/routes` were missing from DB or strict mapping.
- **Unmapped Apps:** 9 apps (including critical business modules like `crm`, `ferry-booking`) were active but not assigned to any section in the DB.
- **Code Defect:** `src/core/menu.ts` was static.

## 3. Remediation
1.  **Dynamic Menu Implementation:**
    - Created `src/core/menu/dynamic.ts` to fetch menu structure directly from `organization_sections` and `organization_section_items` tables via Supabase.
    - This ensures the UI reflects exactly what is in the DB (Strict Compliance).

2.  **UI Refactor:**
    - Updated `src/app/(admin)/admin/t/[tenantSlug]/(dashboard)/apps/page.tsx` to use `getDynamicMenuItems`.

3.  **Database Fix:**
    - Ran `src/scripts/fix_app_visibility.ts`.
    - Inserted missing apps into `organization_apps`.
    - Created missing sections: `Main`, `Logistics`, `Analytics`.
    - Mapped all 29 registry apps to sections.

## 4. Verification
Re-ran `src/scripts/audit_app_visibility.ts`.

**Results:**
- **Registry:** 29 apps.
- **DB Mapped:** 29 apps.
- **Effectively Visible:** 29 apps.
- **Missing/Invisible:** 0.

The Application Library now renders all 29 tiles (including system containers) organized by sections defined in the database.
