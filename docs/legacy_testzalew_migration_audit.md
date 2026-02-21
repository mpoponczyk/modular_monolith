# Legacy Migration Audit: `test_zalew-1`

**Target**: `test_zalew-1` (v0.1.0)
**Date**: 2026-02-18
**Verdict**: **CRITICAL ARCHITECTURAL MATCH FAIL** (Rewrite Required)

---

## 1. Executive Summary

The legacy project `test_zalew-1` is a **Single-Tenant B2C Application** built with Next.js 16 and Supabase. It is **fundamentally incompatible** with the Strict Modular Monolith architecture without a complete rewrite of the data access and authorization layers.

**Critical Findings**:
1.  **Zero Multi-Tenancy**: Database schema lacks `tenant_id` on all core business tables (`clnt_reservations`, `clnt_routes`, `clnt_trips`).
2.  **Global RLS**: Security policies are either "Public Read" or "Authenticated User Owns Row". There is no concept of Tenant isolation.
3.  **No Middleware**: There is no central auth gate; authorization is scattered in Server Actions.
4.  **Implicit Context**: The application assumes a single "System" context. There is no `tenantSlug` in routes.

---

## 2. Strict Evidence-Based Findings

### 2.1. Routing & Tenancy
**Claim**: No tenant routing exists.
**Evidence**:
*   `grep -R "tenantSlug" src` -> **EXIT CODE 1 (NOT FOUND)**.
*   `src/app` structure: `admin`, `login`, `book`, `standard-routes` (No dynamic tenant segments).
**Conclusion**: Single-Tenant by Design.

### 2.2. Middleware Existence
**Claim**: No middleware exists.
**Evidence**:
*   `ls src/middleware.ts` -> **EXIT CODE 1 (NOT FOUND)**.
**Conclusion**: **NO AUTH GATE**. Authorization relies entirely on ad-hoc checks within Server Actions or Pages.

### 2.3. Database Schema (Tenant ID & RLS)
**Claim**: Zero Multi-Tenancy & Public Read.
**Evidence**:
*   `grep "tenant_id" supabase/schema_complete.sql` -> **EXIT CODE 1 (NOT FOUND)**.
*   **Public Policies**:
    ```sql
    CREATE POLICY "Public read ferries" ON "public"."clnt_ferries" FOR SELECT USING (true);
    CREATE POLICY "Public read routes" ON "public"."clnt_routes" FOR SELECT USING (true);
    ```
**Conclusion**: The schema exposes all core business data to ANY anonymous user/script.

### 2.4. DB Access Inventory
**Claim**: Widespread direct DB access.
**Evidence**:
*   `grep -R "\.from(" src` -> **130+ Matches**.
*   **RPC Usage**: Zero. The application bypasses RPCs completely for data fetching.

---

## 3. Feature Inventory & Mapping

### 3.1. Booking Domain
*   **Entry Points**: `HomeBookingWidget`, `/book/custom`, `/standard-routes`.
*   **Tables**: `clnt_routes`, `clnt_locations`, `clnt_ferries`, `clnt_trips`, `clnt_reservations`.
*   **Target Module**: `modules/ferry-booking`.
*   **Mapping**:
    *   Legacy: Client-side fetches -> Monolith: Server Actions with RPCs.
    *   Legacy: Public RLS -> Monolith: Tenant-Scoped RLS.

### 3.2. Auth & Security
*   **Entry Points**: Login Page, `checkDevice` action.
*   **Tables**: `auth_trusted_devices` (Custom 2FA-lite).
*   **Target**: `core/security` (Enhancement) or `modules/device-trust`.
*   **Status**: **Refactor**. The logic is complex and specific; needs adaptation to `serverGuard`.

### 3.3. Admin / Cockpit
*   **Entry Points**: `cockpit-painter`, `admin-menu`.
*   **Tables**: `admin_apps_*`.
*   **Target**: `modules/admin-menu` / `modules/cockpit`.
*   **Status**: **Replace**. Legacy uses a DB-driven menu system that conflicts with the Monolith's static Module Registry.

---

## 4. Retrofit Impact Analysis

Retrofitting `tenant_id` to the existing schema is **HIGH RISK**.

| Table | Risk | Why? |
| :--- | :--- | :--- |
| `clnt_locations` | **HIGH** | `name` is likely unique global. Retrofit requires `UNIQUE(tenant_id, name)`. |
| `clnt_routes` | **CRITICAL** | `origin_id` + `destination_id` unique constraint likely exists. Must become `UNIQUE(tenant_id, origin, dest)`. |
| `clnt_trips` | **CRITICAL** | Massive data volume potential. Backfilling `tenant_id` on live production is risky. |
| `clnt_reservations` | **CRITICAL** | Financial data. If `tenant_id` is wrong, billing is wrong. FK cascades are complex. |

---

## 5. Security Difference Analysis

| Vector | Legacy (test_zalew-1) | Strict Monolith (Target) |
| :--- | :--- | :--- |
| **Tenancy** | Implicit / None | Explicit `TenantContext` |
| **Data Access** | Direct `.from()` in Components | `Repository` Pattern ONLY |
| **Mutations** | Direct `.insert()` | SECURITY DEFINER RPCs ONLY |
| **RLS Policy** | `USING (true)` (Public) | `tenant_id = auth.uid()` (Strict) |
| **Middleware** | None | `serverGuard` (Fail-Closed) |

**Impact**: Copying legacy code directly **breaks the security model immediately**.

---

## 6. Migration Strategy

**Verdict**: **REWRITE** (Reference Implementation). Do not copy-paste.

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

## 7. Verification Toolkit

Ref use these commands to verify the legacy code's state:

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
