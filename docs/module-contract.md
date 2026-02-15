# MODULE CONTRACT (RBAC v2 – Permissions First, Multi-Tenant Ready)

Every admin module must export a ModuleDefinition object
from its index.ts file.

This document defines the required structure, RBAC model,
multi-tenant guarantees, layering rules, and isolation constraints
for all admin modules.

=========================================================
CORE PRINCIPLE
=========================================================

The system uses a PERMISSIONS-FIRST RBAC model.

- Roles are aggregates of permissions.
- Modules depend ONLY on permissions.
- Modules MUST NOT depend on roles.
- Permissions are ALWAYS tenant-scoped.
- Multi-tenancy is mandatory from day one.

Roles exist only as grouping mechanisms in the database layer.

=========================================================
REQUIRED STRUCTURE
=========================================================

src/modules/<moduleId>/
  index.ts
  config.ts
  permissions.ts
  routes.ts
  ui/

Optional (for advanced modules):

  domain/
  application/
  infrastructure/
  variants/
  db/            (migrations or schema definitions only)

Notes:

- Database access logic must live in infrastructure/.
- The db/ directory may contain schema definitions or migrations only.
- db/ must NOT contain business logic or database access code.
- Modules must NOT access Supabase directly from ui/.

=========================================================
ModuleDefinition Interface
=========================================================

export interface ModuleDefinition {
  id: string
  name: string

  system: {
    isActive: boolean
  }

  permissions: {
    requiredPermissions: string[]
  }

  layout: {
    showInMenu: boolean
    order: number
    menuGroup?: string
  }

  routes: RouteDefinition[]

  variants?: Record<string, unknown>
}

=========================================================
RBAC CONTRACT
=========================================================

1. Permissions-First Enforcement

- requiredPermissions defines capabilities required to access the module.
- Modules MUST NOT reference roles.
- Roles are resolved to permissions in repository/application layer.
- ModuleDefinition MUST NEVER contain requiredRoles.

Correct:

requiredPermissions: ["users.read"]

Forbidden:

requiredRoles: ["admin"]

---------------------------------------------------------

2. Wildcard Permission

Symbol:

*

Rules:

- "*" grants ALL permissions within the CURRENT TENANT ONLY.
- "*" does NOT grant cross-tenant access.
- Repository MUST return raw "*" without expanding it.
- Expansion logic MUST exist only in RBAC layer (e.g., canAccessModule).

---------------------------------------------------------

3. Tenant Scope (Strict)

Permissions are ALWAYS tenant-scoped.

UserContext MUST represent permissions resolved for ONE tenant only:

interface UserContext {
  userId: string
  permissions: string[]
}

Modules MUST NOT assume:

- global permissions
- cross-tenant access
- implicit tenant selection

Tenant resolution MUST happen before module evaluation.

=========================================================
ACTIVATION CONTRACT
=========================================================

A module is active IF AND ONLY IF:

module.system.isActive === true
AND
(
  tenant_modules for this tenant is EMPTY
  OR
  tenant_modules contains module.id
)

Rules:

- system.isActive = false cannot be overridden by database.
- tenant_modules is tenant-scoped.
- Empty tenant_modules = all system-active modules allowed.

=========================================================
ROUTING RULES
=========================================================

- RouteDefinition.path MUST start with "/".
- Every module MUST define a root route using path: "/".
- A route with path "*" MAY be defined for nested routes.
- Wildcard routes DO NOT replace the required root "/" route.
- Routing MUST be tenant-agnostic.
- Routing MUST NOT depend on database state.

=========================================================
CONTRACT RULES
=========================================================

1. index.ts MUST export the ModuleDefinition.

2. A module MUST be fully self-contained inside:

   src/modules/<moduleId>/

3. A module MUST NOT import any other module from src/modules.
   Cross-module dependencies are strictly forbidden.

4. A module MAY import only:

   - src/core/*
   - src/shared/*
   - its own internal files

5. Business logic MUST NOT live in ui/.

=========================================================
LAYERING RULES
=========================================================

domain/

- Must be framework-independent.
- Must NOT import:
  - React
  - Next.js
  - Supabase
  - database access code
- Must NOT depend on application, infrastructure, or UI.

application/

- Orchestrates domain logic.
- May define repository interfaces.
- Must NOT depend on concrete infrastructure.

infrastructure/

- Implements repository interfaces.
- May depend on domain types.
- Must NOT contain business rules.
- MUST explicitly filter by tenantId in all queries.
- RLS is a safety net, NOT primary logic.

=========================================================
MULTI-TENANT GUARANTEE
=========================================================

Modules MUST be tenant-agnostic.

- ModuleDefinition MUST NOT depend on tenant state.
- Module code MUST NOT assume default tenant.
- Tenant resolution MUST occur before module access checks.
- Removing a tenant MUST NOT break module system.

=========================================================
MODULE REMOVAL RULE
=========================================================

Removing a module MUST require only:

- deleting its folder
- removing it from moduleRegistry

No other changes MUST be necessary.

Database changes are allowed only if the module explicitly owns
migrations inside its own db/ directory.

=========================================================
SUMMARY
=========================================================

- Roles = permission aggregators (database only).
- Permissions = capability atoms (module-level enforcement).
- "*" = tenant-scoped super-permission.
- Multi-tenant isolation is mandatory.
- Modules are self-contained and removable.
- RBAC expansion happens in application layer, not repository.
