# MODULE CONTRACT

Every admin module must export a ModuleDefinition object
from its index.ts file.

This document defines the required structure, constraints,
layering rules, and isolation guarantees for all admin modules.

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
- db/ must not contain business logic or database access code.

=========================================================
ModuleDefinition Interface
=========================================================

{
  id: string
  name: string

  system: {
    isActive: boolean
  }

  permissions: {
    requiredRoles: string[]
  }

  layout: {
    showInMenu: boolean
    order: number
    menuGroup?: string
  }

  routes: RouteDefinition[]

  variants?: Record<string, unknown>
}

RouteDefinition rules:

- RouteDefinition.path must start with "/".
- Every module must define a root route using path: "/".
- A route with path "*" may be defined to handle nested subpaths.
- Wildcard routes do NOT replace the required root "/" route.

=========================================================
CONTRACT RULES
=========================================================

1. index.ts must export the ModuleDefinition.

2. A module must be fully self-contained inside:
   src/modules/<moduleId>/.

3. A module must not import any other module from src/modules.
   Cross-module dependencies are strictly forbidden.

4. A module may import only:
   - src/core/*
   - src/shared/*
   - its own internal files.

5. Business logic must not live in ui/.

6. If domain/ is present:

   - Domain must be framework-independent.
   - Domain must not depend on application, infrastructure,
     UI, or any framework code.
   - Domain must not import React, Next.js, Supabase,
     or database access code.

7. If application/ is present:

   - Application orchestrates domain logic.
   - Repository interfaces must be defined in domain or application.
   - Application must not depend on concrete infrastructure implementations.

8. If infrastructure/ is present:

   - Infrastructure implements repository interfaces.
   - Infrastructure may depend on domain only for types/interfaces.
   - Infrastructure must not contain business rules.

9. Module must comply with the Module Removal Rule:

   Removing the module requires only:
   - deleting its folder
   - removing it from moduleRegistry

   No other changes must be necessary.
