# MIGRATION PLAN

Goal:
Rebuild the existing admin system into a Modular Monolith architecture
while reusing the existing database.
The new repository must comply strictly with:
- ARCHITECTURE_RULES.md
- module-contract.md
- System Architecture document

=========================================================
PHASE 1 – FOUNDATION
=========================================================

Objective:
Create architectural skeleton without migrating business logic.

Steps:

1. Create base folders:
   - src/core
   - src/modules
   - src/shared
   - src/db

2. Implement ModuleDefinition type in src/core/types.ts.

3. Implement src/core/moduleRegistry.ts:
   - Single source of truth for module registration.
   - No activation logic.
   - No permission logic.

4. Implement dynamic admin routing:
   - Use a single catch-all route in src/app/(admin).
   - Routing must resolve modules exclusively via moduleRegistry.
   - No static file-based routes for modules are allowed.

5. Implement separation of concerns in routing:
   - resolveRoute() → resolves module + route only.
   - isModuleActive() → evaluates system + tenant activation.
   - canAccessModule() → evaluates RBAC.
   - Rendering happens only after all checks pass.

6. Implement dynamic admin layout:
   - Menu must be generated exclusively from moduleRegistry.
   - Layout must respect:
     - module.system.isActive
     - tenant activation
     - permissions
     - layout.showInMenu

Constraints:
- No business logic migration in this phase.
- No database refactoring.
- No domain extraction yet.

Success Criteria:
- Project builds and runs locally.
- Admin routing works dynamically.
- Removal rule holds for a test module.

=========================================================
PHASE 2 – SIMPLE MODULE MIGRATION
=========================================================

Objective:
Migrate simple CRUD-style modules without domain refactoring.

For each module:

1. Identify all related files in legacy project.
2. Move them into:
   src/modules/<moduleId>/

3. Restructure module to match module-contract:
   - index.ts (exports ModuleDefinition)
   - config.ts
   - permissions.ts
   - routes.ts
   - ui/

4. Fix imports to comply with isolation rules:
   - No cross-module imports.
   - Only allowed imports:
     - src/core/*
     - src/shared/*
     - internal module files.

5. Register module in moduleRegistry.

6. Remove legacy scattered files.

7. Ensure build passes.

Success Criteria (per module):
- Module works identically to legacy behavior.
- No cross-module imports exist.
- Removing module folder + registry entry does not break build.
- Admin routing remains fully functional after module removal.

=========================================================
PHASE 3 – COMPLEX DOMAIN REFACTOR
=========================================================

Objective:
Refactor modules with complex business logic
(e.g., pricing, billing, rule engines).

Required layered structure:

src/modules/<moduleId>/
  domain/
  application/
  infrastructure/
  ui/

Steps:

1. Extract business logic into domain/.
   - Domain must contain pure logic only.
   - Domain must not import:
     - React
     - Next.js
     - Supabase
     - infrastructure
     - UI

2. Define repository interfaces in:
   - domain/ OR
   - application/
   (Never in infrastructure.)

3. Create use cases in application/.
   - Application orchestrates domain + repository interfaces.

4. Implement repository logic in infrastructure/.
   - Infrastructure implements repository interfaces.
   - Infrastructure may depend on domain only for types.

5. Keep UI thin:
   - UI must call application layer.
   - UI must not contain business rules.

Success Criteria:
- Domain layer is framework-independent.
- Application does not import infrastructure implementations directly.
- Infrastructure implements defined interfaces.
- Module still complies with removal rule.

=========================================================
VALIDATION (AFTER EACH PHASE)
=========================================================

The following checks must pass:

1. Build must pass.
2. No cross-module imports.
3. Removing module folder + registry entry must not break build.
4. Admin routing must remain fully dynamic and functional.
5. domain layer must not import framework or database code.
6. Application must not depend on concrete infrastructure implementations.
7. No business logic in UI components.

Any violation is considered architectural debt
and must be corrected before proceeding.
