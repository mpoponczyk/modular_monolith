# Task: Strict 2FA SQL Migration & Paranoid Audit

- [x] Analyze existing database schema for foreign keys (`tenants`, `tenant_users`) <!-- id: 0 -->
- [x] Draft Strict SQL Migration <!-- id: 1 -->
    - [x] Define tables (`login_challenges`, `twofa_sessions`) with constraints
    - [x] Define RLS policies enforcing tenant isolation
    - [x] Create RPCs (`create`, `verify`, `validate`) with `SECURITY DEFINER`
    - [x] Define Indexes and Grants
- [x] Create Self-Audit Checklist <!-- id: 2 -->
- [x] Create Validation Script (`validate_2fa.ts`) <!-- id: 5 -->
- [x] Run Validation Script (Confirmed Migration Needed) <!-- id: 6 -->
- [x] Produce Consolidated Migration SQL (`manual_migration_bundle.sql`) <!-- id: 4 -->
- [x] **Apply Migration Automatically** (User provided credentials) <!-- id: 7 -->
    - [x] Fix: Enable `pgcrypto`
    - [x] Fix: `search_path` to include `extensions`
- [x] Re-run Validation Script (Post-Migration) <!-- id: 8 -->
- [x] Final Cleanup (Remove credentials/scripts) <!-- id: 9 -->

## Phase 2: Strict Paranoid Audit
- [x] **Enhance Static Analysis** (`verify_strict_hierarchy.sh`) <!-- id: 10 -->
    - [x] Check `login_challenges` and `twofa_sessions` (Passed)
- [x] **Create Dynamic DB Audit** (`paranoid_db_audit.ts`) <!-- id: 11 -->
    - [x] Check RLS (Enabled + Forced) on ALL public tables
    - [x] Check Permissions (No public/anon access) - **FAILED INITIALLY**
    - [x] Check RPC Security (Security Definer + Search Path)
    - [x] Check 2FA Table Structure
- [x] **Remediate Permission Leaks** (`remediate_permissions.sql`) <!-- id: 14 -->
    - [x] Revoked all permissions from `public`/`anon` on strict tables.
- [x] **Run Paranoid Audit (Retry)** <!-- id: 12 -->
    - [x] **PASSED**: System is Secure.
- [x] **Report Findings** <!-- id: 13 -->

## Phase 3: Documentation Sync (Strict Evidence)
- [x] **Update 10_SECURITY_MODEL.md** (Variant A, Evidence) <!-- id: 15 -->
- [x] **Update 08_FAILURE_MODES.md** (Exact Redirect Reasons) <!-- id: 16 -->
- [x] **Update 09_VERIFICATION_MODEL.md** (Hex, TimingSafe, Payload, RPC) <!-- id: 17 -->

## Phase 4: Paranoid Documentation Reality Check
- [x] **Create Audit Script** (`src/scripts/audit_docs_reality.ts`) <!-- id: 18 -->
- [x] **Conduct "Paranoid Documentation Audit"**
  - [x] verify `09_VERIFICATION_MODEL.md` against codebase
  - [x] verify `10_SECURITY_MODEL.md` file references
  - [x] verify `08_FAILURE_MODES.md` code implementation
  - [x] fix any discrepancies found (Edge Runtime, Search Path, Verification Commands)
- [x] **Deep Scan & RPC Hardening** <!-- id: 23 -->
    - [x] **Audit**: Found `search_path` missing `extensions` in `20260216164354_2fa.sql`.
    - [x] **Fix**: Updated migration file and `manual_migration_bundle.sql`.
    - [x] **Apply**: Executed `apply_strict_fix.ts` using provided DB credentials.
- [x] **Final Report** <!-- id: 22 -->

## Phase 5: Consolidation & Verification
- [x] Consolidate Migrations into Single File <!-- id: 24 -->
- [x] Cleanup Migration Directory <!-- id: 25 -->
- [x] Verify Audit with New Structure <!-- id: 26 -->
- [x] Execute Consolidated Migration on DB <!-- id: 27 -->

## Phase 6: Ownership & Release
- [x] Add "mateusz poponczyk" header to all code files <!-- id: 28 -->
- [x] Commit and Push Changes <!-- id: 29 -->
- [x] Create GitHub Release `v0.0.1-prealpha.1` <!-- id: 30 -->
- [x] Generate `.docx` Documentation <!-- id: 31 -->
- [x] Update Release with Documentation <!-- id: 32 -->

## Phase 7: Safe UI Port
- [x] Create Safe UI Port Plan <!-- id: 33 -->
- [x] Implement `resolve_user_tenants` RPC <!-- id: 37 -->
- [x] Port Legacy Login UI (Visuals Only) <!-- id: 38 -->
- [x] Implement Secure Login Logic (RPC + Redirect) <!-- id: 39 -->
- [x] Port Legacy Admin Layout (Visuals Only) <!-- id: 40 -->
- [x] Implement Admin Layout Integration (Tenant Routing) <!-- id: 41 -->
- [x] Verify UI Safety (Grep Gauntlet) <!-- id: 42 -->
- [x] Refine Login UI (Match Admin Screenshot) <!-- id: 43 -->

## Phase 8: Strict I18n Architecture
- [x] **Plan Strict I18n Implementation** (No deps, No middleware) <!-- id: 44 -->
- [x] **Create I18n Core Structure** (`src/shared/i18n`) <!-- id: 45 -->
    - [x] `settings.ts` (Constants)
    - [x] `server.ts` (RSC Translator)
    - [x] `client.ts` (Client Hook)
- [x] **Create Global Locales** (`en`, `pl`) <!-- id: 46 -->
    - [x] `common.json`
    - [x] `auth.json`
- [x] **Integrate Language Switcher** (Real Implementation) <!-- id: 47 -->
- [x] **Verify Core Purity** (Grep Rules) <!-- id: 48 -->
- [x] **Update Architecture Documentation** <!-- id: 49 -->

## Phase X: Organization Menu & Variants System
- [x] **Create Implementation Plan** (`phase_x_plan.md`) <!-- id: 50 -->
- [x] **Draft Full SQL Schema** (`src/db/migrations/20260217000000_org_menu_variants.sql`) <!-- id: 51 -->
    - [x] Tables: `organization_sections`, `organization_apps`, `organization_languages`
    - [x] Translations: `organization_section_translations`, `organization_app_translations`
    - [x] Links & Variants: `organization_section_items`, `organization_menu_variants`, `organization_menu_variant_items`
    - [x] Overrides: `organization_module_overrides`
- [x] **Define Security & RLS** <!-- id: 52 -->
    - [x] Enable & Force RLS on all tables
    - [x] Create `SECURITY DEFINER` RPCs for all writes
    - [x] Revoke public/anon permissions
- [x] **Implement Server-Side Logic** <!-- id: 53 -->
    - [x] `moduleRegistry` integration check
    - [x] Menu Resolution Algorithm (RPC `resolve_menu_structure`)
- [x] **Verify & Audit** <!-- id: 54 -->
    - [x] Create `verify_menu_structure.sh` (Grep invariants)
    - [x] Verify SQL Migration against strict rules
    - [x] Implement `MenuService` (Server-Side Only)
    - [x] Implement `MenuContext` (Variant State) - (Implemented via `setActiveVariant` in Service)
    - [x] **Document Architecture** <!-- id: 55 -->
        - [x] Create `docs/architecture/11_MENUS_AND_VARIANTS.md`
        - [x] Update Consolidated Documentation
        - [x] Create Release 009 Definition
    - [x] **Git Push**

## Phase 9: Section Editor Migration (Legacy -> Strict)
- [x] **Plan Migration Strategy** (Analysis & Mapping) <!-- id: 56 -->
- [x] **Define Test Environment** (Bootstrap Script) <!-- id: 57 -->
- [x] **Implement Missing RPCs** (CRUD & Ordering) <!-- id: 58 -->
- [x] **Implement Section Editor Module** (`organization-menu-manager`) <!-- id: 59 -->
    - [x] List View (Direct RLS Read)
    - [x] Create/Update/Delete Actions (RPC Write)
    - [x] Translation Logic
    - [x] Link/Unlink Apps
- [x] **Verify Strictness** (No Client RBAC, Fail-Closed) <!-- id: 60 -->

## Phase 10: Strict Auth & Tenant Guard Fixes
- [x] **Strict Server Layout Guard** (Redirect Unauth) <!-- id: 61 -->
- [x] **Debug Tenant Resolution** (Fix No Tenants Found - Populate tenant_users) <!-- id: 62 -->
- [x] **Verify Authentication Flow** (Fail-Closed) <!-- id: 63 -->
- [x] **Resolve Multi-Tenant Conflict** (Strict Single-Tenant Enforcement)
- [x] **Fix SQL Script Errors** ("Role does not exist" validation)
- [x] **Rename & Cleanup Tenants** (Enforce "Test Tenant" naming)
- [x] **Refactor Admin Layouts** (Strict 2FA Guard + Header Mode)
    - [x] Create `HeaderAdminLayout` (Legacy Header style)
    - [x] Isolate Dashboard from 2FA (Route Groups)
    - [x] Implement Auto-Send & Legacy UI for 2FA Page
- [x] **Configure Email Service** (Added `RESEND_API_KEY` & Verified Delivery)
- [x] **Design Admin Email Template** (Dark Mode, "modMonolith" Branding)
    - [x] Implemented `AdminEmailTemplate.ts`
    - [x] Integrated into `ResendEmailService`
    - [x] Sent Test Examples to `mateusz.poponczyk@gmail.com`
- [x] **Localize 2FA & Emails** (PL/EN Support)
    - [x] Translated 2FA Screen (Added `auth.json` keys)
    - [x] Refactored 2FA Page to Server Component (Locale Injection)
    - [x] Updated `ResendEmailService` with localized templates
    - [x] Tested PL/EN Email Delivery
    - [x] Refined Email Content (Static "modMonolith" system name)
    - [x] Enhanced Design (SVG Logo, Gradient Header, Red Warning Box)
    - [x] Verified Full Suite of Emails (EN/PL Template & Code)
    - [x] Updated Template to use `email-header.png` (Configurable via ENV)
    - [x] Switched to Embedded Images (CID) for Email Clients
    - [x] Fixed Image Aspect Ratio (4:1) & Inline Disposition
- [x] **Enhance 2FA Input Experience**
    - [x] Created `OtpInput` component (6-digit, numeric-only, auto-focus)
    - [x] Implemented Fluid Backspace & Paste Support
    - [x] Integrated into `TwoFactorForm`
- [x] **Refine 2FA UI Content**
    - [x] Added Footer "© 2026 Mateusz Popończyk"
    - [x] Genericized Verification Message (Removed "test-tenant")
- [x] **Update Test User Emails**
    - [x] Migrated `section-admin` to `mateusz.poponczyk@gmail.com`
    - [x] Migrated `section-member` to `matix1730@gmail.com`
- [x] **Debug & Fix Runtime Errors**
    - [x] **Fix 2FA Redirect Loop** (`NEXT_REDIRECT` error) -> Refactored to Client-Side Navigation
    - [x] **Fix TenantPage Performance Error** ("Negative time stamp") -> Redirected Root to Dashboard
    - [x] **Fix Email Image Delivery** -> Switched to CSS/HTML Header (No Attachments)
- [x] **Strict Architecture Fixes** (Self-Audit Remediation)
    - [x] **Fix RBAC Logic**: Enforced "AND" logic (.every) in `src/core/rbac.ts`.
    - [x] **Fix Membership Redirect**: Implemented 404 for Authenticated vs Unauthorized in `TenantPage` & `TenantLayout`.
- [x] **UI Cleanup**
    - [x] **Header Title**: Changed to "modMonolith" (Static, no tenant name).
    - [x] **Menu Cleanup**: DELETED Hierarchy Modules (Org, Company, Project, Offering). Implemented Paranoid Cleanup (Files + Registry).

    - [x] **Strict UI Refactor**
    - [x] **Migration**: Create `user_preferences` table (RLS enabled).
    - [x] **Data Layer**: Implement `IUserPreferenceRepository` & `SupabaseUserPreferenceRepository`.
    - [x] **Fix**: Apply `20260217210000_user_preferences.sql` (Missed in consolidation).
    - [x] **Logic**: Create Server Action for theme toggling (DB + Cookie).
    - [x] **UI Components**: Build `UserDropdown` and `ThemeSwitcher`.
    - [x] **Header Integration**: Connect new components to `LegacyHeader` & `HeaderAdminLayout`.
    - [x] **Fix Theme Palette**: Implemented `RootLayout` cookie reading + `ThemeSwitcher` client-side sync.
    - [x] **Fix Dark Mode Strategy**: Created `tailwind.config.ts` with `darkMode: 'selector'` to enforce class-based toggling.
    - [x] **Final Recursive Paranoid Audit**: Passed strict checks (Docs, Theme, Hierarchy, UI Safety).

## Phase 13: Theme & I18n Polish
- [x] **Fix Hardcoded Colors** (Header & Menu)
    - [x] Refactor `LegacyHeader.tsx` to use semantic tokens (`bg-background`, `text-foreground`).
    - [x] Refactor `HeaderAdminLayout.tsx` to use semantic tokens.
- [x] **Restrict Languages**
    - [x] Update `i18n/settings.ts` to allowed list (`en`, `pl`).
    - [x] Verify `LanguageSwitcher` options.
- [x] **Translate Dashboard**
    - [x] Locate Dashboard component.
    - [x] Extract hardcoded strings.
    - [x] Add keys to `en.json` and `pl.json`.
    - [x] Implement `useTranslation` or pass dictionary.
- [x] **UI Refinement**: Improve button contrast in Dark Mode.
    - [x] Verify `globals.css` color definitions.
    - [x] Update `UserDropdown` trigger styles.
    - [x] Update Header button hover styles.
- [x] **Import 'Zalew' Theme**
    - [x] Extract colors from `test_zalew-1`.
    - [x] Update `globals.css` Light Mode variables to match.
    - [x] Verify Light Mode appearance.

## Phase 14: Sidebar & App Library
- [x] **Sidebar Implementation** (Left-Side Overlay)
    - [x] Create `Sidebar.tsx` component (Collapsible, Left-aligned).
    - [x] Integrate into `HeaderAdminLayout.tsx` (Menu button on Left).
    - [x] Add "App Library" and "Dashboard" items.
- [x] **App Library Feature**
    - [x] Create `src/app/(admin)/admin/t/[tenantSlug]/(dashboard)/apps/page.tsx`.
    - [x] Implement grouping logic (Sections).
    - [x] Add translations.

## Phase 15: Security Audit


- [x] **Strict Hardening**
  - [x] Zero-Assumption Mode
  - [x] **Final Strict Validation**




    - [x] Initial Build (Failed)
    - [x] Fix Type Errors
    - [x] Re-run Build (Success)
    - [x] Generate Evidence Report
    - [x] DB Parity Proof (Verified Remote)
    - [x] Strict Contradiction Audit (Passed)

    - [x] Strict Registry Consistency (Auto-Remediated)

    - [x] Strict Legacy Parity Proof (L subset of R)
    - [x] Strict UI/UX/Functional Audit (Report Generated)
    - [x] Functional Parity Remediation Plan (Defined)

## Phase 20: Strict Functional Parity Remediation (Execution)
- [ ] **Batch 1: Critical Infrastructure**
    - [x] Users (`core-admin/users`) - Invite/Edit/Block.
    - [x] Routes (`ferry-booking/routes`) - Create/Edit.
    - [x] Roles (`core-admin/roles`) - Create/Edit/Perms.
- [x] **Batch 2: Operational Core**
    - [x] Ferries (`ferry-booking/ferries`) - Edit/Delete.
    - [x] Partners (`crm/partners`) - Create/Edit.
    - [x] Templates (`ferry-planning/templates`) - Pattern Builder.
    - [x] Profiles (`ferry-pricing/profiles`) - Matrix Editor.
- [x] **Batch 3: Visualization & Reporting**
    - [x] Gantt (`ferry-planning/gantt`) - Interactive.
    - [x] Sales (`ferry-reporting/sales`) - Revenue Dashboard.
- [x] **Batch 4: Polish & Advanced**
    - [x] Settings (`core-admin/settings`).
    - [x] Invoices (`ferry-booking/invoices`).
    - [x] Services (`ferry-booking/services`).
    - [x] Cockpits (`core-admin/cockpits`).
    - [x] Planning (`core-admin/planning`).
    - [x] Calendar (`ferry-planning/calendar`).

## Phase 21: Release
e_2fa.ts`.
    - [x] Run `verify_strict_hierarchy.sh`.
    - [x] Verify RLS policies.
    - [x] Audit module isolation.

## Phase 16: Stability Fixes
- [ ] **Fix Navigation Performance Error**
    - [x] Disable prefetching in Sidebar.
    - [x] Rename `TenantPage` component.
    - [x] Add `loading.tsx` boundary.
    - [x] Restart Dev Server.
    - [x] Fix user `mateusz.poponczyk@gmail.com` access.
    - [x] Resolve Ambiguity (Remove `demo-tenant` link, keep `test-tenant`).
    - [x] Monitor if error persists.

## Phase 18: Debugging & Optimization
- [x] Debug: Fix multiple 2FA email dispatch (User reports 3 emails).
- [x] Debug: Fix 2FA Loop (Layout Guard vs Custom Cookie).
- [x] Run `verify_doc_integrity.ts` (Structure Check).
- [x] Run `audit_docs_reality.ts` (Drift Check).
- [x] Run `verify_i18n_strictness.sh` (Localization Rules).
- [x] Run `verify_strict_layout.ts` (Layout Rules).

## Phase 19: Final Paranoid Audit (Post-Fixes)
- [x] Run `verify_strict_layout.ts`.

## Phase 19: Final Paranoid Audit & Documentation
- [x] Run `verify_strict_hierarchy.sh`.
- [x] Run `validate_2fa.ts`.
- [x] Run `verify_doc_integrity.ts`.
- [x] Run `audit_docs_reality.ts`.
- [x] Run `verify_i18n_strictness.sh`.
- [x] Run `verify_strict_layout.ts`.
- [x] Deep Audit of `docs/architecture/*.md` (Updated 01, 09, 10, 11).

## Phase 20: Release
- [x] Git Commit & Push.
- [x] Git Commit & Push.
- [x] Create Tag `0.0.5` ("ready for apps").

## Phase 21: Legacy Audit (test_zalew-1)
- [x] Structural Index (File Tree).
- [x] Analyze DB Schema (Single-Tenant, Global RLS).
- [x] Analyze Auth (No Middleware, Custom Cookies).
- [x] Analyze UI Components (`HomeBookingWidget`).
- [x] Generate Final Audit Report.

## Phase 22: Strict Evidence Re-Audit (test_zalew-1)
- [x] Evidence: Env & Versions.
- [x] Evidence: Routing & Tenancy (Canonical Check).
- [x] Evidence: Middleware Existence.
- [x] Evidence: DB Schema (RLS & Tenant ID).
- [x] Evidence: DB Access Inventory.
- [x] Evidence: Auth Model.
- [ ] Deliverable: `legacy_audit_evidence_test_zalew.md`.
- [x] Deliverable: `legacy_audit_evidence_test_zalew.md`.

## Phase 23: Audit Supplement (test_zalew-1)
- [x] Section A: Feature Inventory.
- [x] Section B: Retrofit Impact.
- [x] Section C: Mapping.
- [x] Section D: Security Diff.
- [x] Section E: Migration.
- [x] Section F: Verification.
- [x] Deliverable: `legacy_audit_supplement_test_zalew.md`.
- [x] Merge all audit reports into `docs/legacy_testzalew_migration_audit.md`.

## Phase 24: Migration - Phase 1 (Rewrite)
*   **Goal**: First Vertical Slice (Ferry Routes Read-Only).
- [x] Step 1: Feature Inventory & Target Mapping.
- [x] Step 2: Parallel Tenant-Scoped Schema (`mnt_*`).
- [x] Step 3: Implement `modules/ferry-booking` (Repositories & Service).
- [x] Step 4: Implement UI (Routes Listing).
- [x] Step 5: Verification (Strict Grep & Build).

## Phase 25: Migration - Phase 2 (Mutations)
*   **Goal**: Write Operations (Create Route) via Strict RPCs.
- [x] Step 6: Implement Mutation RPCs (`create_ferry_route`).
- [x] Step 7: Update Module Logic (Repo/Service for Writes).
- [x] Step 8: Implementation UI (Create Route Action).
- [x] Step 9: Verification (Write Flow).

## Phase 26: Migration - Phase 3 (Data Migration)
*   **Goal**: Move legacy `clnt_` data to `mnt_` with strict tenant scoping.
- [x] Step 10: Create Data Migration Script (`migrate_clnt_to_mnt.sql`).
- [x] Step 11: Execute Full Stack Migration (`npx tsx src/scripts/apply_full_stack_migration.ts`).
- [x] Step 12: Verify Data Integrity (Script will verify).

## Phase 27: Migration - Phase 4 (Functional & UI Verification)
*   **Goal**: Ensure the application correctly reads/writes `mnt_` data via the UI.
- [x] Step 13: Start Local Server (Background).
- [x] Step 14: Verify Admin Access & Routes List (Browser/Curl).
- [ ] Step 15: Verify Route Creation (Browser/Action).
- [x] Step 16: Complete Legacy App Inventory (DB Discovery).

## Phase 2: Logistics & Booking (Sales Domain)
- [x] Step 17: Implement Sales Schema (Trips, Res, Orders).
- [x] Step 17b: Fix Ferry Schema (Add Capacity Vehicles).
- [x] Step 18: Implement Trip Repository & Service.
- [x] Step 19: Implement Reservation Repository & Service.
- [x] Step 20: Implement Booking Flow UI (Search -> Book).

## Phase 3: Admin Logistics & Sales UI (Migration)
*   **Goal**: Port legacy Admin Management apps to `ferry-booking` module using Strict Architecture.
- [x] Step 21: Implement Trips Management (List / Create / Edit / Delete).
- [x] Step 22: Implement Reservations Management (List / Details / Cancel).
- [x] Step 23: Implement Orders Management (List / Details / Invoice).
- [-] Step 24: Implement Pricing Management (Route Pricing) (Skipped for MVP).
- [x] Step 25: Verify Admin Logic (Strict Grep & Manual Test).

## Phase 4: Post-Migration Comprehensive Audit
*   **Goal**: Strict architectural and parity audit of all 21 applications.
- [x] Step 26: Infrastructure Audit (Automated Script).
- [x] Step 27: Functional & Parity Gap Analysis (Manual/Inventory).
- [x] Step 28: Generate Final Audit Report.

## Phase 4: Missing Apps Implementation
*   **Goal**: Implement the 14 missing applications according to Strict Modular Monolith.
- [x] Step 29: Analyze & Classify Missing Apps (Artifact).
- [/] Step 30: Implement Core System (Users, Roles, Settings).
    - [x] 30.1: Core Users (Domain/Repo/UI).
    - [x] 30.2: Core RBAC (Domain/Repo/UI).
    - [x] 30.3: Core Settings (Domain/Repo/UI).
- [x] Step 31: Implement Operations Domain (Planning, Reporting).
    - [x] 31.1: Ferry Planning Module (Gantt, Templates).
    - [x] 31.2: Ferry Reporting Module (Manifests).
    - [x] 31.3: Fleet Services (Ferry Booking Extension).
- [x] Step 32: Implement CRM & Analytics.
    - [x] 32.1: CRM Module (Partners).
    - [x] 32.2: Analytics Dashboard (Sales/Occupancy).

## Phase 5: Global Polish & E2E Verification
*   **Goal**: Transition from "Feature Complete" to "Production Ready".
- [x] Step 33: Implement Commercial Features (Pricing).
    - [x] 33.1: Pricing Module (Profiles, Seasonality).
    - [/] 33.2: Link Pricing to Routes.
- [x] Step 34: UI/UX Polish.
    - [x] 34.1: Consistent Layouts & Breadcrumbs.
    - [x] 34.2: Loading States & Error Boundaries.
- [/] Step 35: End-to-End Verification.
    - [/] 35.1: Create `verify_e2e_flow.ts` (Full Lifecycle Simulation).
    - [ ] 35.2: Execute E2E Verification.

## Phase 28: Strict Full System Validation (Architecture & Security)
- [ ] **Step 0: Load System Contract** (Extract from .docs) <!-- id: 64 -->
- [ ] **Step 1: Generate Canonical App List** (from moduleRegistry) <!-- id: 65 -->
- [x] **Step 2A-F: Deep Validation** (Completed - See Report) <!-- id: 66 -->
- [/] **Step 3: Registry vs DB Consistency** (Re-Verify) <!-- id: 72 -->
- [ ] **Step 3: Registry vs DB Consistency** (Re-Verify) <!-- id: 72 -->
- [x] **Step 4: Final Strict Report** (NO-GO) <!-- id: 73 -->

## Phase 31: Strict Remediation (NO-GO Fixes)
- [/] **Phase 1: Critical Security Fixes** <!-- id: 74 -->
    - [x] `core-admin/users`: Remove `createAdminClient` <!-- id: 75 -->
    - [x] `ferry-booking`: Enforce permissions on mutations <!-- id: 76 -->
    - [x] Verify Phase 1 (Build + Grep) <!-- id: 77 -->
- [x] **Phase 8: Registry vs Database Consistency Check** <!-- id: 8 -->
    - [x] Verify strict parity between `moduleRegistry.ts` and `organization_apps` table. <!-- id: 8.1 -->
    - [x] Confirm ZERO drift using `ensure_strict_consistency.ts`. <!-- id: 8.2 -->
    - [x] `core-admin` Structure Fixes <!-- id: 81 -->
    - [x] Verify Phase 2 (Structure Audit) <!-- id: 82 -->
    - [ ] Fix Cross-Module Imports <!-- id: 83 -->
- [x] **Phase 9: Final Report & Verdict** <!-- id: 9 -->
    - [x] Compile `STRICT_FULL_VALIDATION_REPORT_FINAL.md`. <!-- id: 9.1 -->
    - [x] Detail PASS/FAIL status for each application. <!-- id: 9.2 -->
    - [x] issue GLOBAL GO/NO-GO verdict. <!-- id: 9.3 -->
- [x] **Ensure 'mateusz.poponczyk@gmail.com' has full admin privileges**
    - [x] Resolve User ID and Context (Active Tenant)
    - [x] Enumerate all required permissions (P_required)
    - [x] Enumerate user's effective permissions (P_user_effective)
    - [x] Validate Superuser Status (P_required ⊆ P_user_effective)
    - [x] Automate remediation (Grant missing permissions if needed)
    - [x] Validate Tenant Isolation (Ensure no cross-tenant leakage)
    - [x] Generate Report (Permissions, Roles, Confirmation). <!-- id: 10.6 -->
- [x] Strict UI Tile Visibility Audit <!-- id: 13395 -->
    - [x] Audit for missing apps in DB <!-- id: 13298 -->
    - [x] Fix `AppLibraryPage` (use dynamic DB menu) <!-- id: 13380 -->
    - [x] Remediate DB (seed missing apps/sections) <!-- id: 13396 -->
    - [x] Verification (Audit Script PASS) <!-- id: 13400 -->
    - [x] **Strict Fix: RPC for Menu Fetching** <!-- id: 13401 -->
        - [x] Create `20260219000000_resolve_menu_rpc.sql`
        - [x] Apply Migration
        - [x] Refactor `dynamic.ts` to use RPC
    - [x] Audit Layering: `core-admin` <!-- id: 94 -->
    - [x] Verify DTO Usage <!-- id: 95 -->
    - [x] Verify Business Logic Isolation <!-- id: 96 -->
- [x] **Phase 4: Consistency & Functional** <!-- id: 84 -->
    - [x] Fix Registry vs Seed Mismatches <!-- id: 85 -->
    - [x] Implement Missing Pages (`crm/customers`, `manifests`) <!-- id: 86 -->
- [x] **Phase 5: Final Validation** <!-- id: 87 -->
    - [x] Final Build & Grep <!-- id: 88 -->
    - [x] Produce PASS Report <!-- id: 89 -->

- [x] **Phase 6: Strict Full System Validation (Directive)** <!-- id: 100 -->
    - [x] STEP 0: Extract System Contract <!-- id: 101 -->
    - [x] STEP 1: Generate Canonical App List <!-- id: 102 -->
    - [x] STEP 2: Deep Validation (Per App) <!-- id: 103 -->
    - [x] STEP 3: Registry Consistency <!-- id: 104 -->
    - [x] STEP 4: Final GO/NO-GO Report <!-- id: 105 -->

- [x] **Phase 7: Strict Full System Validation (Directive Re-Run)** <!-- id: 106 -->
    - [x] STEP 0: Extract System Contract (Fresh) <!-- id: 107 -->
    - [x] STEP 1: Generate Canonical App List (Fresh) <!-- id: 108 -->
    - [x] STEP 2: Deep Validation (Sequential) <!-- id: 109 -->
        - [x] Functional Validation <!-- id: 110 -->
        - [x] Tenant Isolation <!-- id: 111 -->
        - [x] Security Hardening <!-- id: 112 -->
        - [x] Permission Enforcement <!-- id: 113 -->
        - [x] Architectural Compliance <!-- id: 114 -->
    - [x] STEP 3: Registry Consistency <!-- id: 115 -->
    - [x] STEP 4: Final Strict Report <!-- id: 116 -->

## Phase 32: Strict Extraction & Routing Convergence
- [x] **Phase 0: Inventory** <!-- id: 13700 -->
    - [x] Generate Source vs Target Inventory <!-- id: 13701 -->
- [ ] **Phase 1: App Extraction (Sequential)** <!-- id: 13702 -->
    - [x] Extract `core-admin/users` <!-- id: 13703 -->
        - [x] Verified Grep (0 DB Access)
        - [x] Validated Build (Fixed script types)
    - [x] Extract `core-admin/roles` <!-- id: 13704 -->
        - [x] Verified Grep (0 DB Access)
        - [x] Verified Build
    - [x] Extract `ferry-booking/*` <!-- id: 13705 -->
        - [x] Extract `ferry-booking/routes`
        - [x] Extract `ferry-booking/routes/create`
        - [x] Extract `ferry-booking/services`
        - [x] Extract `ferry-booking/trips`
        - [x] Extract `ferry-booking/trips/create`
        - [x] Extract `ferry-booking/trips/[id]`
    - [/] Extract `ferry-planning/*` <!-- id: 13705b -->
        - [x] Extract `ferry-planning/calendar`
        - [x] Extract `ferry-planning/gantt`
        - [x] Extract `ferry-planning/templates`
    - [/] Extract `ferry-pricing/*`
        - [x] Extract `ferry-pricing/profiles`
        - [x] Extract `ferry-pricing/routes`
    - [/] Extract `crm/*`
        - [x] Extract `crm/partners`
        - [x] Extract `crm/customers`
    - [/] Extract `ferry-reporting/*`
        - [x] Extract `ferry-reporting/manifests`
        - [x] Extract `ferry-reporting/sales`
    - [x] Extract `core-admin/cockpits`
    - [x] Extract `core-admin/planning`
    - [x] Extract `core-admin/sessions`

## Phase 33: Strict Safe Settings Consolidation
- [x] **Phase 1: Schema Extension (No Drop)**
    - [x] Extend `tenant_settings` table
    - [x] Update/Create RPCs (`get`, `update`)
    - [x] Produce SQL Migration
- [x] **Phase 2: Runtime Audit**
    - [x] Search `sys_settings` usage (Found in `SupabaseSettingsRepository`)
    - [x] Identify Critical Paths (Page, Actions, Repo)
- [x] **Phase 3: Dual Read Transition**
    - [x] Refactor Repositories (Used RPC)
    - [x] Implement Fallback Logic (In RPC)
    - [x] Verify No Direct DB Reads (Grep Verified)
- [x] **Phase 4: Data Migration (Skipped)**
    - [x] Check `sys_settings` existence (Table Missing - Skipped)
- [x] **Phase 5: Hard Cut**
    - [x] Remove Fallback Logic from RPC
    - [x] Final Verification (Manual & Build)
- [x] **Phase 2: Dynamic Router** <!-- id: 13706 -->
    - [x] Implement `[...slug]/page.tsx` <!-- id: 13707 -->
- [x] **Phase 3: Menu Fix** <!-- id: 13708 -->
    - [x] Update `dynamic.ts` links <!-- id: 13709 -->
- [ ] **Phase 4: Decommission** <!-- id: 13710 -->
    - [ ] Delete `src/app/.../apps` <!-- id: 13711 -->
