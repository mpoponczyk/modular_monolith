# ARCHITECTURE VALIDATION RULES

These rules define mandatory validation checks
for architectural compliance.

All checks must pass before merging or continuing migration.

=========================================================
MODULE ISOLATION
=========================================================

1. No cross-module imports:
   - No file inside src/modules/<A> may import from src/modules/<B>.

2. Modules may import only:
   - src/core/*
   - src/shared/*
   - their own internal files.

=========================================================
LAYER VALIDATION
=========================================================

3. Domain layer must have zero imports from:
   - React
   - Next.js
   - Supabase
   - application layer
   - infrastructure layer
   - ui layer
   - any framework-specific library

4. Application layer:
   - Must not import concrete infrastructure implementations.
   - May depend only on repository interfaces.
   - Must not contain framework-specific code unless explicitly required
     by orchestration logic.

5. Infrastructure layer:
   - Must implement repository interfaces.
   - May depend on domain only for types/interfaces.
   - Must not contain business rules.

6. UI layer:
   - Must not contain business logic.
   - Must delegate use cases to application layer.

=========================================================
ROUTING & REGISTRY
=========================================================

7. moduleRegistry must be the only global module reference point.

8. No static Next.js file-based routes may be created for modules.
   Admin routing must resolve modules dynamically via moduleRegistry.

=========================================================
REMOVAL RULE VALIDATION
=========================================================

9. Module removal test must pass:

   After:
   - Deleting src/modules/<moduleId>
   - Removing entry from moduleRegistry

   The following must hold:

   - Build passes
   - No TypeScript errors
   - Admin routing remains fully functional
   - No orphaned imports exist

=========================================================
GENERAL COMPLIANCE
=========================================================

10. No business logic in UI components.

11. No framework or database access code in domain layer.

Violations must be reported explicitly,
including file paths and rule numbers.
No partial compliance is acceptable.
