# Architecture Validation Script

To validate the architecture compliance, run the following checks:

1. **Build Check**: `npm run build` (or similar)
2. **Module Isolation Check**: Only `src/core/moduleRegistry.ts` imports from `src/modules`.
3. **Circular Dependency Check**: Ensure no cycles involving modules.
4. **Removal Rule Check**:
   - Delete `src/modules/example-dashboard`
   - Remove import from `src/core/moduleRegistry.ts`
   - Run build. Should pass.

## Manual Test Plan

1. Navigate to `/admin/dashboard`.
   - Should render "Dashboard".
2. Navigate to `/admin/unknown`.
   - Should render 404 (or similar).
3. Test RBAC:
   - Add `requiredRoles: ['superadmin']` to module.
   - Verify access denied with default mock context.
