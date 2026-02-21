# Legacy TestZalew Migration Audit (Master Document)

**Status**: Consolidates 3 Architect Reports (Initial, Evidence, Supplement)
**Target**: `test_zalew-1` (v0.1.0)
**Date**: 2026-02-18
**Verdict**: **CRITICAL ARCHITECTURAL MATCH FAIL** (Rewrite Required)

---

# PART 1: INITIAL DEEP CODE AUDIT
*(Source: `legacy_audit_test_zalew.md`)*

## 1. Executive Summary
The legacy project `test_zalew-1` is a **Single-Tenant B2C Application** built with Next.js 16 and Supabase. It is **fundamentally incompatible** with the Strict Modular Monolith architecture without a complete rewrite of the data access and authorization layers.

**Critical Findings**:
1.  **Zero Multi-Tenancy**: Database schema lacks `tenant_id` on all core business tables (`clnt_reservations`, `clnt_routes`, `clnt_trips`).
2.  **Global RLS**: Security policies are either "Public Read" or "Authenticated User Owns Row". There is no concept of Tenant isolation.
3.  **Client-Side Auth Logic**: Authorization logic is scattered in Server Actions (`src/modules/auth/actions.ts`) and lacks a centralized Middleware gate.
4.  **Implicit Context**: The application assumes a single "System" context. There is no `tenantSlug` in routes.

---

## 2. Phase 1: Static Code Scan (Structural Index)

### File Categorization
*   **App Router**: `src/app` (Standard Next.js 16 layout).
*   **Modules**: `src/modules` (Contains `auth`, `cockpit-painter`, `admin-menu`, `profile`). *Note: These "modules" are not isolated packages but simple folder groupings.*
*   **Lib/Utils**: `src/lib/queries.ts`, `src/utils/supabase`.
*   **Components**: `src/components/home-booking-widget.tsx` (Client-side logic).

### Structural Violations
*   **Direct DB Access**: `src/lib/queries.ts` exports raw Supabase queries without tenant filters.
*   **Global State**: `src/lib/i18n.ts` initializes a global single-instance i18n object.
*   **Routing**: Routes are global (e.g., `/standard-routes`, `/book/custom`). No `/t/[tenant]` prefix.

---

## 3. Phase 2: Security & Tenancy Violations

| Violation | Severity | Location | Description | Correction |
| :--- | :--- | :--- | :--- | :--- |
| **Implicit Single Tenancy** | **CRITICAL** | DB Schema | Tables `clnt_routes`, `clnt_trips` lack `tenant_id`. | Add `tenant_id` column to ALL tables. |
| **Global Public Read** | **CRITICAL** | `schema_complete.sql` | Policies like "Public read routes" expose ALL data to anon users. | Rewrite RLS to enforce `tenant_id` check. |
| **Missing Auth Middleware** | **HIGH** | `middleware.ts` (Missing) | No transport-level auth gate. Auth checks happen ad-hoc in Actions. | Implement strict Middleware with Tenant & Auth guards. |
| **Unfiltered Queries** | **HIGH** | `src/lib/queries.ts` | `getRoutes()` selects `*` from `clnt_routes` without filter. | Inject `tenant_id` filter in ALL queries. |
| **Client-Side I18n** | **MEDIUM** | `src/lib/i18n.ts` | Hardcoded `pl` fallback, no URL-based locale. | Move to Server-Side I18n with URL prefixes. |
| **Ad-Hoc Auth Logic** | **HIGH** | `auth/actions.ts` | Custom device-trust logic mixed with login. | Refactor into `core/security` standard Auth flow. |

---

## 4. Phase 3: Query Analysis

### `src/lib/queries.ts`
*   `getRoutes()`: **UNSAFE**. Selects all routes globally.
    *   *Fix*: `select * from clnt_routes where tenant_id = ?` (plus RLS).
*   `getTripById(id)`: **UNSAFE**. Fetches trip by UUID but ignores tenant context.
    *   *Fix*: Verify trip belongs to current tenant.

### `src/app/standard-routes/page.tsx`
*   Inline Query: `supabase.from('clnt_routes').select(...)`
    *   **Architecture Violation**: UI component querying DB directly.
    *   *Fix*: Move to encapsulated Service/Repository pattern.

---

## 5. Phase 4: Auth & Access Model

**Current State**:
*   **Authentication**: Supabase Auth (Email/Password) + Custom "Trusted Device" layer (`auth_trusted_devices`).
*   **Authorization**: "Superadmin" flag in `auth_profiles`. No granular RBAC defined in code (though schema has `auth_roles`).
*   **Routing**: No canonical tenant routing. `test_zalew-1` assumes one global portal.

**Required Changes**:
1.  **Adopt `TenantContext`**: All requests must resolve a tenant.
2.  **Migrate "Trusted Device"**: If valuable, this feature must be refactored into a `SecurityModule`.
3.  **Strict Middleware**: Replace ad-hoc checks with the standard `serverGuard`.

---

## 6. Phase 5: Feature Migration Plan

### Feature: **Ferry Booking (B2C)**
*   **Target Module**: `modules/ferry-booking` (New)
*   **Status**: **Rewrite Required**.
*   **Data**: `clnt_routes`, `clnt_trips`, `clnt_reservations`.
*   **Logic**: Port `HomeBookingWidget` logic to use Server Actions backed by Tenant-Scoped Services.

### Feature: **Device Trust (2FA-lite)**
*   **Target Module**: `core/security` (Enhancement) or `modules/device-trust`.
*   **Status**: **Refactor**.
*   **Logic**: The `auth/actions.ts` logic is complex and specific. It validates strict 2FA needs.

### Feature: **Admin Menu**
*   **Target Module**: `modules/admin-menu` (Existing in Monolith).
*   **Status**: **Replace**.
*   **Logic**: Legacy uses `admin_apps_*` tables. Monolith use `moduleRegistry` + `menu.ts`. The legacy DB-driven menu is arguably *more advanced* (Phase 2 target), but currently incompatible with the static Monolith definition.

---

## 7. Phase 6: Risk Matrix

### Top 3 Security Risks
1.  **Data Leakage**: Without `tenant_id`, a multi-tenant deployment would leak all routes/trips to all users.
2.  **Bypassed Auth**: Lack of middleware means "secret" pages might be accessible if not individually gated.
3.  **Public RLS**: "Public read" policies are dangerous if sensitive data is ever added to those tables.

### Top 3 Architectural Violations
1.  **Single Tenancy**: The biggest blocker.
2.  **Direct UI-DB Coupling**: Pages fetching data directly.
3.  **Ad-Hoc Modules**: Modules in `src/modules` are not isolated (no `index.ts` barriers).

### Migration Difficulty: **HARD**
*   The data model must be migrated (Alter tables + Data migration).
*   The frontend must be updated to handle `[tenantSlug]` routing.
*   The generic "App Library" in legacy is data-driven, while Monolith is code-driven. Merging these strategies requires careful design.

---
---

# PART 2: STRICT EVIDENCE-BASED AUDIT
*(Source: `legacy_audit_evidence_test_zalew.md`)*

## 1. Environment & Versions
**Source**: `package.json`
```json
"dependencies": {
    "@supabase/supabase-js": "^2.93.3",
    "next": "16.1.6",
    "react": "19.2.3",
    "i18next": "^25.8.0"
}
```
**Node**: `v20.18.0` (Verified in env).

## 2. Routing & Tenancy (Canonical Check)
**Claim**: No tenant routing exists.
**Evidence**:
1.  **File Tree**: `src/app` contains `admin`, `login`, `book`, `standard-routes`.
    *   **NO** `[tenantSlug]` dynamic routes found in root or subdirectories.
2.  **Code Search**:
    *   `grep -R "tenantSlug" src` -> **EXIT CODE 1 (NOT FOUND)**.
    *   `grep -R "/admin/t/" src` -> **EXIT CODE 1 (NOT FOUND)**.

**Conclusion**: The application is **Single-Tenant by Design**. It assumes a single global context.

## 3. Middleware Existence
**Claim**: No middleware exists.
**Evidence**:
1.  **File Check**:
    *   `ls -la middleware.ts src/middleware.ts` -> **EXIT CODE 1 (No such file)**.
2.  **Code Search**:
    *   `grep -R "NextResponse" src` -> Matches found in API routes (`route.ts`) and Actions, but NO central middleware file.

**Conclusion**: **NO AUTH GATE**. Authorization relies entirely on ad-hoc checks within Server Actions or Pages.

## 4. Database Schema (Tenant ID & RLS)
**Claim 1**: Zero Multi-Tenancy (No `tenant_id`).
**Evidence**:
*   `grep "tenant_id" supabase/schema_complete.sql` -> **EXIT CODE 1 (NOT FOUND)**.
*   **Table List** (Sample of Business Tables):
    *   `CREATE TABLE "public"."clnt_reservations"` -> No `tenant_id`.
    *   `CREATE TABLE "public"."clnt_routes"` -> No `tenant_id`.
    *   `CREATE TABLE "public"."clnt_trips"` -> No `tenant_id`.

**Claim 2**: Public Read RLS.
**Evidence** (Raw Extracts from `schema_complete.sql`):
```sql
CREATE POLICY "Public read ferries" ON "public"."clnt_ferries" FOR SELECT USING (true);
CREATE POLICY "Public read locations" ON "public"."clnt_locations" FOR SELECT USING (true);
CREATE POLICY "Public read routes" ON "public"."clnt_routes" FOR SELECT USING (true);
CREATE POLICY "Public read trips" ON "public"."clnt_trips" FOR SELECT USING (true);
```
**Conclusion**: The schema exposes all core business data to ANY anonymous user/script.

## 5. DB Access Inventory
**Claim**: Widespread direct DB access.
**Evidence**:
1.  **Direct Calls**:
    *   `grep -R "\.from(" src` -> **130+ Matches**.
    *   Example: `src/lib/queries.ts:6`: `await supabase.from("clnt_routes").select("*")`
    *   Example: `src/app/standard-routes/page.tsx:8`: `.from('clnt_routes')`
2.  **RPC Usage**:
    *   `grep -R "\.rpc" src` -> **EXIT CODE 1 (NOT FOUND)**.
    *   The application **Bypasses RPCs** completely for data fetching.

## 6. Auth Model Claims
**Claim**: Superadmin, Roles, Device Trust exist in Schema.
**Evidence**:
1.  **Superadmin**:
    *   `CREATE OR REPLACE FUNCTION "public"."check_is_superadmin"()` exists in schema.
2.  **Roles**:
    *   `CREATE TABLE IF NOT EXISTS "public"."auth_roles"` exists.
3.  **Device Trust**:
    *   `CREATE TABLE IF NOT EXISTS "public"."auth_trusted_devices"` exists.
    *   Used extensively in `src/modules/auth/actions.ts`.

## 7. Migration Decision
**Question**: Retrofit or Rewrite?

**Verdict**: **REWRITE** (Reference Implementation).

**Reasoning**:
1.  **Data Incompatibility**: Retrofitting `tenant_id` to `clnt_*` tables requires modifying all 130+ DB calls and RLS policies.
2.  **Security Risk**: The "Public Read" policies are fundamentally unsafe for a multi-tenant system. Miss changing ONE policy, and you leak data.
3.  **Logic Logic**: The application uses separate "Modules" folders but they are not architecturally isolated.

**Plan**:
1.  **Ignore** `test_zalew-1` code for direct copy-paste.
2.  **Re-implement** logic in `Modular_Monolith` using the **Strict Module Contract**:
    *   `modules/ferry-booking`: Port `clnt_routes` logic but add `tenant_id`.
    *   `core/security`: Adapt the `auth_trusted_devices` concept if needed, but implement it via `serverGuard`.

---
---

# PART 3: SUPPLEMENTARY AUDIT
*(Source: `legacy_audit_supplement_test_zalew.md`)*

## Section A: Complete Feature Inventory

### 1) Booking Domain
*   **Entry Points**:
    *   `src/components/home-booking-widget.tsx` (Client Flow Start)
    *   `src/app/book/custom/page.tsx` (Booking Wizard)
    *   `src/app/standard-routes/page.tsx` (Route Listing)
*   **Server Actions**:
    *   `src/app/book/custom/actions.ts`: `getLocations`, `searchAvailability`
    *   `src/lib/queries.ts`: `getRoutes`, `getTripById`
*   **DB Tables**:
    *   `clnt_routes`, `clnt_locations`, `clnt_ferries`, `clnt_trips`, `clnt_reservations`, `clnt_tickets`, `clnt_trip_pricing`
*   **Security**:
    *   **RLS**: `USING (true)` (Public Read) for Routes, Locations, Ferries.
    *   **RPC**: Not used. Direct `.from()` calls.

### 2) Auth & Security
*   **Entry Points**:
    *   `src/app/login/page.tsx`
    *   `src/modules/auth/actions.ts`: `login`, `logout`, `checkDevice`
*   **DB Tables**:
    *   `auth_profiles` (Superadmin flag)
    *   `auth_roles` (RBAC - Unused in logic)
    *   `auth_trusted_devices` (Custom 2FA-lite)
*   **Security**:
    *   **Logic**: Custom "Device Trust" logic mixed with Supabase Auth.
    *   **RLS**: `auth_profiles` visible to authenticated users.

### 3) Admin / Cockpit
*   **Entry Points**:
    *   `src/modules/cockpit-painter` (Canvas Logic)
    *   `src/modules/admin-menu` (DB-driven Menu)
*   **DB Tables**:
    *   `admin_apps_*`, `admin_user_app_config`
*   **Security**:
    *   **RLS**: Generally authenticated-only, but no tenant isolation.

### 4) I18n / Localization
*   **Entry Points**: `src/lib/i18n.ts`
*   **Implementation**: Client-side `i18next` initialization.
*   **Issues**: Hardcoded `pl` fallback. No server-side detection.

---

## Section B: Tenancy Retrofit Impact Map

| Table | Retrofit Risk | Why? |
| :--- | :--- | :--- |
| `clnt_locations` | **HIGH** | `name` is likely unique global. Retrofit requires `UNIQUE(tenant_id, name)`. |
| `clnt_ferries` | **MEDIUM** | Linked to trips. Must cascade tenant_id to `clnt_trips`. |
| `clnt_routes` | **CRITICAL** | `origin_id` + `destination_id` unique constraint likely exists. Must become `UNIQUE(tenant_id, origin, dest)`. |
| `clnt_trips` | **CRITICAL** | Massive data volume potential. Backfilling `tenant_id` on live production is risky. |
| `clnt_reservations` | **CRITICAL** | Financial data. If `tenant_id` is wrong, billing is wrong. |

**Foreign Key Cascades**:
*   `clnt_tickets` -> `clnt_reservations` -> `clnt_trips` -> `clnt_routes`.
*   **Impact**: You cannot just add `tenant_id` to `reservations`. You must ensure it matches the `trip`'s tenant.

---

## Section C: Feature -> Monolith Mapping Plan

| Feature | Target Module | Type | Permissions |
| :--- | :--- | :--- | :--- |
| **Booking** | `modules/ferry-booking` | **Domain** | `ferries.view`, `ferries.book` |
| **Route Mgmt** | `modules/ferry-booking` | **Domain** | `routes.manage` |
| **Device Trust** | `core/security` | **Core** | N/A (System Level) |
| **Admin Menu** | `modules/admin-menu` | **Utility** | `menu.manage` |
| **Cockpit** | `modules/cockpit` | **Feature** | `cockpit.view` |

**Routing Changes**:
*   Legacy: `/book/custom`
*   Monolith: `/admin/t/[tenantSlug]/apps/ferry-booking/book` (or public tenant route)

---

## Section D: Security Difference Analysis

| vector | Legacy (test_zalew-1) | Strict Monolith (Target) |
| :--- | :--- | :--- |
| **Tenancy** | Implicit / None | Explicit `TenantContext` |
| **Data Access** | Direct `.from()` in Components | `Repository` Pattern ONLY |
| **Mutations** | Direct `.insert()` | SECURITY DEFINER RPCs ONLY |
| **RLS Policy** | `USING (true)` (Public) | `tenant_id = auth.uid()` (Strict) |
| **Middleware** | None | `serverGuard` (Fail-Closed) |

**Impact**: Copying legacy code directly **breaks the security model immediately**. The legacy code assumes it can read anything. The Monolith will block it.

---

## Section E: Minimal Safe Migration Strategy

**Phase 1: Parallel Schema (Safe)**
1.  Create `mnt_` (monolith) tables in the SAME database matching the legacy schema but WITH `tenant_id`.
2.  Do NOT touch `clnt_*` tables.
3.  Write a sync script to copy `clnt_` data to `mnt_` with a default `tenant_id`.

**Phase 2: Module Reimplementation (Clean)**
1.  Build `modules/ferry-booking` using `mnt_*` tables.
2.  Use standard Repositories and RPCs.
3.  Verify logic in isolation.

**Phase 3: Switchover**
1.  Redirect traffic to Monolith routes.
2.  Decommission `clnt_*` tables.

---

## Section F: Missing Verification Commands

```bash
# Detect Direct DB Calls in UI (Layout Violation)
grep -r "supabase.from" src/app --include="*.tsx"

# Detect Server Actions with Raw DB Access
grep -r "supabase.from" src/modules --include="actions.ts"

# Detect Tables Missing Tenant ID
grep "CREATE TABLE" supabase/schema_complete.sql | grep -v "tenant_id"

# Detect Public RLS Policies
grep "CREATE POLICY" supabase/schema_complete.sql | grep "USING (true)"
```
