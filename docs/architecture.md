# System Architecture

This system follows a Modular Monolith architecture.

The repository is divided into:

- src/app        → Next.js routes (public + admin shell)
- src/core       → Admin engine (RBAC, layout engine, module registry)
- src/modules    → All admin applications (isolated modules)
- src/shared     → Shared UI components and utilities
- src/db         → Database integration layer

## Key Principles

1. The admin panel is composed of independent modules.
2. Each module must be self-contained inside:
   src/modules/<moduleId>/
3. Modules are registered only in:
   src/core/moduleRegistry.ts
4. Modules must not import other modules.
5. Business logic must not live in UI components.
6. Dependency direction must follow:
   ui → application → domain.
   Application may depend on repository interfaces.
   Infrastructure implements those interfaces.
   Repository interfaces must be defined in domain or application layer,
   never in infrastructure.
   Infrastructure may depend on domain only for types/interfaces.
   Domain must not depend on application, infrastructure, UI, or framework code.

7. Public and Admin routing layers must remain separated.
   Admin modules must not be directly mounted as Next.js file-system routes.


## Module Removal Rule

Removing a module must require:
- deleting its folder
- removing it from moduleRegistry
- no additional code changes

If additional changes are required, the architecture is broken.

Admin routing must be fully dynamic and based exclusively on moduleRegistry.

