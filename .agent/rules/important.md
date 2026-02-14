---
trigger: always_on
---

- Project structure follows:
  src/app
  src/core
  src/modules
  src/shared
  src/db

- Modules must comply with module-contract.md.

- Tenant activation semantics:
  Final activation =
    module.system.isActive
    AND
    (TenantContext.activeModuleIds empty
     OR module.id in activeModuleIds)

- Complex modules must use layered structure:
  domain/
  application/
  infrastructure/
  ui/

- Validation must follow ARCHITECTURE_VALIDATION_RULES.md.
