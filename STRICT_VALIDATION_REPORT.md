# Strict System Validation Report

**Date:** 2026-02-18
**Status:** **NO-GO**
**Auditor:** Antigravity Agent

## 1. Executive Summary
The system has undergone a Strict Full System Validation against the architectural invariants defined in the System Contract (`.docs/`). While the core infrastructure (tenancy, RBAC, DB Isolation) is sound, the Application Layer exhibits widespread compliance failures ranging from Security Violations (High Risk) to Architectural Structural issues (Medium Risk) and Consistency Gaps.

**Global Verdict:** **FAIL** - The system is NOT ready for production release under Strict Mode.

## 2. Application Validation Matrix

| Application | Status | Type | Primary Defect |
| :--- | :--- | :--- | :--- |
| `core-admin/users` | **FAIL** | **Security** | `createAdminClient` used in request flow (Invite User). |
| `core-admin/roles` | **PASS** | - | Compliant. |
| `core-admin/sessions` | **FAIL** | Functional | Placeholder UI ("Skeleton Mode"). |
| `core-admin/settings` | **FAIL** | Structure | Repository located in module root (should be `infrastructure/`). |
| `core-admin/cockpits` | **FAIL** | Structure | Repository located in module root. |
| `core-admin/planning` | **FAIL** | Architecture | Page imports concrete Repository directly (Layer Skipping). |
| `crm/customers` | **FAIL** | Functional | Route 404 (Missing `page.tsx`). |
| `crm/partners` | **FAIL** | Structure | Actions & Logic located in App Router folder (`src/app`). |
| `ferry-booking/ferries` | **PASS** | - | Model Module. Compliant. |
| `ferry-booking/routes` | **FAIL** | **Security** | Mutation Actions (`create`, `delete`) lack Permission Checks. Structure Fail (App folder). |
| `ferry-booking/trips` | **FAIL** | **Security** | Mutation Actions lack Permission Checks. Structure Fail (App folder). |
| `ferry-booking/reservations` | **FAIL** | **Security** | `cancelReservationAction` lacks Permission Checks. Consistency Fail (`.cancel` vs `.manage`). |
| `ferry-booking/orders` | **FAIL** | Architecture | Page imports concrete Repository directly. |
| `ferry-booking/invoices` | **FAIL** | Structure | Repository in module root. Logic in App folder. |
| `ferry-booking/services` | **PASS** | - | Compliant (Page uses Action, Action uses Repo). |
| `ferry-planning/calendar` | **PASS** | - | Compliant (Logic in specific client/action). |
| `ferry-planning/templates` | **PASS** | - | Compliant. |
| `ferry-planning/gantt` | **FAIL** | Architecture | Page imports Infrastructure Service directly (Layer Skipping). |
| `ferry-pricing/profiles` | **PASS** | - | Compliant. |
| `ferry-pricing/routes` | **FAIL** | Architecture | Cross-Module Import (Imports `ferry-booking` repository). |
| `ferry-reporting/manifests`| **FAIL** | Functional | Placeholder UI. |
| `ferry-reporting/sales` | **FAIL** | Architecture | Page imports Infrastructure Repo directly. |

## 3. Detailed Defect Analysis

### A. Security Violations (Critical)
1.  **Elevated Privilege Usage (`core-admin/users`)**: The `inviteUserAction` initiates a `createAdminClient()`. In `Strict Mode`, no request-flow code should instantiate an admin client. All user management must happen via specialized RPCs or specific Auth API endpoints scoped to tenancy if possible, or isolated in a separate admin service.
2.  **Missing Permission Checks (`ferry-booking/*`)**:
    *   `routes`: `createRouteAction`, `deleteRouteAction` have **NO** `verifyActionPermission` check. Any authenticated tenant member can modify routes.
    *   `trips`: `createTripAction` etc. have **NO** permission checks.
    *   `reservations`: `cancelReservationAction` has **NO** permission check.

### B. Architectural Structural Failures
1.  **Logic Leakage to App Folder (`crm`, `ferry-booking`)**: Many modules have their `actions.ts` located in `src/app/(admin)/.../apps/<module>/`.
    *   *Rule:* "A module MUST be fully self-contained inside: `src/modules/<moduleId>`".
    *   *Impact:* Logic is coupled to the specific Next.js Router implementation and scattered.
2.  **Repository Placement**: Several modules (`invoices`, `cockpits`, `settings`) place `Repository.ts` in the module root instead of `infrastructure/`.
3.  **Cross-Module Imports**: `ferry-pricing/routes` imports `SupabaseFerryRouteRepository` from `ferry-booking`. This violates module boundaries.

### C. Layering Violations
1.  **UI -> Infrastructure**: `ferry-planning/gantt`, `ferry-booking/orders`, and `core-admin/planning` Pages import `Supabase...Repository` or `Service` classes directly.
    *   *Rule:* UI should interact with Application Facades (Actions/UseCases). Direct dependecy on concrete Infra classes makes the UI hard to test and tightly coupled.

### D. Consistency & Functional Gaps
1.  **Registry vs DB Mismatch**:
    *   Code requires `crm.view`, Database Seed lacks it.
    *   Code requires `reservations.cancel`, Database Seed has `reservations.manage`.
    *   Result: `crm` apps will likely 403. `reservations` cancellation might fail check.
2.  **Missing Pages**: `crm/customers` has a registry entry but no `page.tsx`.
3.  **Placeholders**: `core-admin/sessions` and `ferry-reporting/manifests` are empty shells.

## 4. Remediation Plan (Prioritized)

**Phase 1: Security Fixes (Immediate)**
1.  Add `verifyActionPermission` to ALL `ferry-booking` mutation actions (`routes`, `trips`, `reservations`).
2.  Refactor `core-admin/users` to remove `createAdminClient` or move logic to a secure background function / trusted RPC.
3.  Fix DB Seed: Add `crm.view`, `reservations.cancel`.

**Phase 2: Structural Repairs**
1.  Move all `actions.ts` from `src/app/...` to `src/modules/<id>/`.
2.  Move Repositories to `src/modules/<id>/infrastructure/`.
3.  Refactor `ferry-pricing/routes` to avoid cross-module import (e.g., replicate necessary read model or move route-pricing logic to booking module if tightly coupled).

**Phase 3: Layering & Functional**
1.  Refactor Pages importing Repos to use Actions.
2.  Implement `crm/customers` page.
3.  Implement real logic for `sessions` and `manifests` or remove them from Validated List.

