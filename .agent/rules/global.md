---
trigger: always_on
---

ARCHITECTURE MODE: STRICT

- Modular Monolith architecture is mandatory.
- No cross-module imports.
- Admin routing must be fully dynamic via moduleRegistry.
- No static Next.js routes for admin modules.
- Removal rule must always remain valid.
- Domain must be framework-independent.
- Application must not depend on infrastructure implementations.
- No business logic in UI.
- Architecture compliance overrides implementation speed.
