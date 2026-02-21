# Strict Safe Settings Consolidation Plan

## Objective
Unify `sys_settings` (legacy) and `tenant_settings` (strict) into ONE strict `tenant_settings` table without breaking existing functionality.

## Phase 1: Schema Extension (No Drop)
- [x] Extend `tenant_settings` table with new columns.
- [x] Update/Create RPCs: `get_tenant_settings`, `update_tenant_settings`.
- [x] Validate `tenant_id` check in RPCs.
- [x] Produce SQL migration file.

## Phase 2: Runtime Audit
- [x] Search codebase for `sys_settings`.
- [x] Identify SSR-critical paths (`SupabaseSettingsRepository`).
- [x] Report findings.

## Phase 3: Dual Read Transition
- [x] Refactor `SettingsRepository` to use `get_tenant_settings` RPC.
- [x] Implement fallback logic: `tenant_settings` -> `sys_settings`.
- [x] Verify no direct DB reads in UI.
- [x] Build and Grep validation.

## Phase 6: Remaining Extractions
- [x] `core-admin/cockpits` extracted.
- [x] `core-admin/planning`: Merge App Router logic into Module.
- [ ] `core-admin/sessions`: Extract.
    - [x] Create `get_tenant_sessions` RPC (Strict Security Definer).
    - [x] Update Repository to use RPC.
    - [x] Expose Module via App Router.

## Phase 32.2: Dynamic Router
- [x] Create `src/app/(admin)/admin/t/[tenantSlug]/[...slug]/page.tsx`
    - [x] Match module by ID (Longest Prefix Match).
    - [x] Check System Active status.
    - [x] Check Tenant Allow-List.
    - [x] Check User Permissions (RBAC).
    - [x] Resolve intra-module route.
    - [x] Render Component with `params`.
- [x] Verify using `core-admin/sessions` (via new path).

## Phase 32.3: Menu Fix & Decommission
- [x] Rename `dynamic.ts` to `legacy_menu_cleanup.ts` (or just update it).
- [x] Update `MenuService` to generate paths WITHOUT `/apps/` prefix.
- [ ] Verify Navigation.
- [ ] Delete `src/app/(admin)/admin/t/[tenantSlug]/apps` directory.

## Phase 4: Data Migration
- [x] Script to copy `sys_settings` to `tenant_settings`. (Skipped: `sys_settings` table missing)
- [x] Validate row counts and data integrity.

## Phase 5: Hard Cut
- [x] Remove fallback logic.
- [x] Drop `sys_settings` table. (Skipped: Table missing)
- [x] Final Build and Grep (`sys_settings` = 0 matches).
