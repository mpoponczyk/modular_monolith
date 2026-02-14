# ARCHITECTURE RULES

This repository follows a Modular Monolith architecture.

These rules define global structural constraints.
They are mandatory and override implementation convenience.

=========================================================
GLOBAL STRUCTURE
=========================================================

src/app        → Next.js routing layer
src/core       → Admin engine (RBAC, layout, module runtime)
src/modules    → Admin modules (isolated applications)
src/shared     → Shared UI components and utilities (no business logic)
src/db         → Database integration

Public website and Admin panel must remain separated at routing level.

=========================================================
MODULE ISOLATION RULES
=========================================================

1. Every admin module must live in:
   src/modules/<moduleId>/

2. Modules MUST NOT import other modules from src/modules.

3. Modules may import only:
   - src/core/*
   - src/shared/*
   - their own internal files

4. The only global module reference point is:
   src/core/moduleRegistry.ts

=========================================================
LAYERED ARCHITECTURE (FOR COMPLEX MODULES)
=========================================================

If a module contains complex business logic,
it must use the following structure:

domain/
application/
infrastructure/
ui/

Dependency direction (strict):

ui → application → domain

Application layer:
- May depend only on repository interfaces.
- Must not depend on concrete infrastructure implementations.

Repository interfaces:
- Must be defined in domain or application.
- Must NOT be defined in infrastructure.

Infrastructure layer:
- Implements repository interfaces.
- May depend on domain only for types/interfaces.
- Must not contain business rules.

Domain layer:
- Must be framework-independent.
- Must not depend on application, infrastructure, UI,
  or any framework or database code.
- Must not import:
  - React
  - Next.js
  - Supabase
  - application layer
  - infrastructure layer
  - ui layer

UI layer:
- Must not contain business logic.
- Must delegate use cases to application layer.

=========================================================
ROUTING RULES
=========================================================

Admin routing must be fully dynamic and based exclusively
on src/core/moduleRegistry.ts.

No static Next.js file-based routes may be created
for individual admin modules.

=========================================================
MODULE REMOVAL RULE
=========================================================

Removing a module must require ONLY:

1. Deleting src/modules/<moduleId>
2. Removing its entry from src/core/moduleRegistry.ts

No other changes must be necessary.

If additional changes are required,
architecture is considered violated.

=========================================================
TENANT CONFIGURATION
=========================================================

Module activation must support tenant-based configuration.
System activation and permissions must be evaluated dynamically.

Tenant activation semantics:

1. module.system.isActive is a global hard switch.
   If false, the module is disabled for all tenants.

2. TenantContext.activeModuleIds acts as an allow-list.
   - If the list is empty, it does NOT restrict modules.
   - If the list contains values, only listed modules are enabled.

Final activation rule:

  module.system.isActive
  AND
  (TenantContext.activeModuleIds is empty
   OR module.id is included in TenantContext.activeModuleIds)

Tenant configuration cannot override module.system.isActive.
