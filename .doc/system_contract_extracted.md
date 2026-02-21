# SYSTEM CONTRACT EXTRACTED
**Source:** `.docs/module-contract.md`, `.docs/validation-rules.md`, `.docs/architecture.md`
**Date:** 2026-02-18

## 1. Module Boundaries & Isolation
- **Rule:** A module must be fully self-contained inside `src/modules/<moduleId>`.
- **Rule:** Cross-module imports (src/modules/<A> -> src/modules/<B>) are **STRICTLY FORBIDDEN**.
- **Rule:** Modules may only import from `src/core/*`, `src/shared/*`, or internal files.
- **Rule:** `index.ts` must export `ModuleDefinition`.

## 2. Layering & Dependency Direction
- **UI Layer (`ui/`)**: Must NOT contain business logic. Must delegate to Application layer.
- **Application Layer (`application/`)**: Orchestrates domain logic. May depend on Repo Interfaces. Must NOT depend on concrete Infrastructure.
- **Domain Layer (`domain/`)**: Framework-independent. zero imports from React, Next.js, Supabase, DB.
- **Infrastructure Layer (`infrastructure/`)**: Implements Repo Interfaces. May depend on Domain types. Must NOT contain business rules.
- **Rule:** UI -> Application -> Domain. Infrastructure -> Domain.

## 3. Data Access & Repository Pattern
- **Rule:** Database access logic must live in `infrastructure/`.
- **Rule:** Repositories must explicitly filter by `tenantId` in ALL queries.
- **Rule:** `tenantId` must be passed as an argument to repository methods.
- **Rule:** RLS is a safety net, not primary logic. Application must structurally enforce tenancy.

## 4. Permissions & RBAC
- **Rule:** Permissions-First model. Modules depend ONLY on permissions (`requiredPermissions`), never Roles.
- **Rule:** Permissions are ALWAYS tenant-scoped.
- **Rule:** `verifyActionPermission` or `verifyTenantAccess` must be used in Server Actions / Pages.
- **Rule:** No manual `role === 'admin'` checks.

## 5. Routing & Registry
- **Rule:** Admin routing must be fully dynamic via `src/core/moduleRegistry.ts`.
- **Rule:** No static Next.js file-based routes for admin modules.
- **Rule:** Module removal must require only deleting folder + registry entry.

## 6. Security Hardening
- **Rule:** No `service_role` usage in application flow.
- **Rule:** No `createAdminClient` in runtime actions.
- **Rule:** No direct `supabase.auth.*` queries in UI.

## 7. UI/UX Integrity
- **Rule:** State updates must reflect immediately.
- **Rule:** No dead buttons or 404 routes.
