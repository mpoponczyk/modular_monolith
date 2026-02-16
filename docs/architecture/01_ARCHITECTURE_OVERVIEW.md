# 1. Architecture Overview

## 1.1. System Structure
The system follows a **Strict Modular Monolith** architecture optimized for multi-tenancy, security, and maintainability.

- **Core (`src/core`)**: Contains shared domain logic, authentication, context resolution, and application ports. It is the backbone of the system.
- **Modules (`src/modules`)**: functional verticals (e.g., `example-dashboard`). Isolated by strict boundaries.
- **Infrastructure (`src/infra`)**: implementations of Core ports (e.g., Supabase repositories).
- **Application (`src/app`)**: Next.js App Router handling routing, layouts, and page composition.

## 1.2. Key Principles

### Strict Module Isolation
- Modules must not import from other modules.
- Interaction occurs only via the `moduleRegistry` and Core definitions.
- The `ModuleDefinition` contract enforces structure.

### Multi-Tenant Enforcement
- **Database Level**: All data is tenant-scoped via `tenant_id` columns and Row Level Security (RLS).
- **Application Level**: All repositories force explicit `tenantId` filtering.
- **Context Level**: `AuthContext` is resolved deterministically per request.

### Security Model (See Chapter 10)
- **RPC-Only Writes**: All sensitive mutations (Hierarchy, RBAC, 2FA) MUST occur via `SECURITY DEFINER` RPCs. Direct table writes are forbidden.
- **Strict 2FA**: Tenant-aware, DB-backed 2FA enforcement with session rotation.
- **Fail-Closed**: Systems deny access by default unless explicitly granted.
- **RLS as Safety Net**: Application logic filters data, but RLS ensures safety if logic fails.

### Canonical Routing
- Routes are tenant-scoped: `/admin/t/[tenantSlug]/...`.
- Root `/admin` routes strictly redirect or fail if tenant definition is ambiguous.

## 1.3. Architecture Diagram (ASCII)

```
[Browser Request]
      |
      v
[Next.js Middleware/Routing]
      |
      v
[Layout: /admin/t/[slug]] -> [resolveAuthContext] -> [SupabaseTenantRepository]
      |                             |
      |   (Fail if Null)            v
      |                       [DB: Public Schema]
      |
      v
[Module Page] -> [canAccessModule] -> [RBAC Check]
      |
      v
[Module Component] -> [Repositories] -> [Supabase Client (Auth)]
                                                |
                                                v
                                      [DB: RLS Filtered Data]
```

## 1.4. Sources of Truth

The system relies on specific, authoritative sources for its state:

-   **Module Availability**: Defined by `moduleRegistry` + `ModuleDefinition.system.isActive` (Hard Switch).
-   **Tenant Enablement**: Defined by `tenant_modules` table (Tenant-scoped activation).
-   **RBAC Enforcement**: `requiredPermissions` (Static Contract) vs `resolved user permissions` (Dynamic Context).
-   **Tenant Context**: Resolved strictly per request via `resolveAuthContext` (No global/static state).
-   **Canonical Routing**: The URL path `/admin/t/[tenantSlug]` is the only source of truth for the current tenant.

## 1.5. Tenant Resolution Summary

The system uses a strict, deterministic resolution process:

1.  **Source**: `tenantSlug` is derived **ONLY** from the route parameter `/admin/t/:tenantSlug`.
2.  **Validation**: If the slug is provided but invalid (not found/no access) -> **Fail-Closed** (Redirect to Login/404).
3.  **Missing Slug**:
    -   **1 Tenant**: Implicitly resolved (Auto-Redirect to Canonical).
    -   **>1 Tenant**: Ambiguous -> **409 Conflict** (Redirect to Tenant Selection).
    -   **0 Tenants**: No Access -> **Fail** (403/404).
4.  **Constraints**:
    -   No support for `?tenant=` query parameters in UI.
    -   No "default tenant" or "last visited" fallbacks in the core logic (strictly explicit).

## 1.6. Verification Points (High-Level)

Production invariants that must be verified:

1.  **No Server-Admin**: The `service_role` key is strictly forbidden in the request/response flow.
2.  **Explicit Filtering**: All repository methods MUST require `tenantId` and filter by it explicitly.
3.  **RLS Enforcement**: All tenant-scoped tables MUST have RLS enabled and forced.
4.  **Fail-Closed Routing**: Routes must not render if context is invalid.
5.  **Module Isolation**: No cross-module imports allowed; strict boundary enforcement.

## 1.7. Static vs Dynamic State

The system strictly distinguishes between compile-time definitions and runtime state:

-   **Static (Compile-Time)**:
    -   `moduleRegistry`: The immutable catalog of available code modules.
    -   `ModuleDefinition`: Structural contract (routes, metadata).
    -   `system.isActive`: Hard infrastructure switch (commits/deploys).

-   **Dynamic (Runtime / Data)**:
    -   `tenant_modules`: Which tenants have subscribed to which modules.
    -   `role_permissions`: How abstract roles map to granular permissions.
    -   `resolved user permissions`: The effective permission set for a user in a specific tenant to a specific module.

-   **Per-Request (Ephemeral)**:
    -   `resolveAuthContext`: The calculated identity for the current HTTP request.
    -   `tenantSlug`: The context identifier derived from the URL for this specific execution.
    -   `UserContext`: The temporary object holding the resolved permissions for the duration of the request.
