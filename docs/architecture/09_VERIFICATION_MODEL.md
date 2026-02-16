# 9. Verification Model

Strict automated commands verify the architectural invariants. These commands must pass before any release.

## 9.1. Security Boundary Verification

**Command**: Server-Admin Leak Check
```bash
grep -r "server-admin" src/app src/core src/infra | grep -v "seed" | grep -v "migration"
```
-   **Guarantee**: The powerful `service_role` key is NOT used in the application runtime flow. It is restricted to seeding/migrations.

**Command**: Admin Client Prohibition Check
```bash
grep -r "createAdminClient" src/app src/modules src/core
```
-   **Guarantee**: Strictly prohibits `createAdminClient` usage in runtime code.

**Command**: Direct Write Check (`edit_locks`)
```bash
grep -R "from(['\"]edit_locks['\"])" -n src | grep -E "insert|update|delete"
```
-   **Guarantee**: No application code bypasses the RPCs to modify locks directly.

**Command**: In-Memory Filtering Prevention
```bash
grep -r "\.filter(.*tenant_id" src
```
-   **Guarantee**: Ensures no `tenant_id` filtering happens in application memory (after query execution). Relies on repository-level SQL constraints.

**Command**: Critical TODO Check
```bash
grep -rE "TODO|FIXME" src/core/security src/db/migrations
```
-   **Guarantee**: No unresolved technical debt in critical security paths.

**Command**: Canonical Routing Enforcement
```bash
grep -R --fixed-strings "?tenant=" src/app src/modules
grep -r "searchParams.get('tenant')" src/app src/modules
```
-   **Guarantee**: Prohibits usage of `?tenant=` query parameter or `searchParams` usage in UI routing.

**Command**: Tenant Resolution Encapsulation
```bash
grep -R "resolveTenantForUser" -n src | grep -v "src/core/context/resolveAuthContext.ts"
```
-   **Guarantee**: Ensures `resolveTenantForUser` is only called within the central `resolveAuthContext` allowed path.

## 9.2. Tenant Isolation Verification

**Command**: Tenant Filter Check
```bash
grep -R ".eq(['\"]tenant_id['\"]" -n src/infra/repositories/
```
-   **Guarantee**: Inspects repositories to ensure explicit `.eq('tenant_id', ...)` usage.

## 9.3. Function Security Verification

**Command**: Security Definer Check
```bash
grep -R "security definer" -n src/db/migrations
```
-   **Guarantee**: confirms RPCs are elevated correctly.

**Command**: Excessive Privilege Check
```bash
grep -R "revoke all on function .* from public, anon" -n src/db/migrations
```
-   **Guarantee**: Confirms that strict `REVOKE` statements exist for sensitive RPCs.

**Command**: Manual Membership Revalidation Check
```bash
grep -R "select 1 from public.tenant_users" -n src/db/migrations
```
-   **Guarantee**: Confirms that RPCs manually re-verify tenant membership at the start of execution.

**Command**: FORCE RLS Check
```bash
grep -R "force row level security" -n src/db/migrations
```
-   **Guarantee**: Confirms that **FORCE ROW LEVEL SECURITY** is enabled on sensitive tables, preventing table owners from bypassing policies.

## 9.4. RBAC & Module Verification

**Command**: No Roles in Module Check
```bash
grep -r "requiredRoles" src/modules
```
-   **Guarantee**: Ensures modules rely on Permissions, not Roles.

**Command**: Module Authorization Boundary
```bash
grep -R "canAccessModule" -n src/modules
```
-   **Guarantee**: Modules cannot self-authorize. `canAccessModule` must only be used in the routing boundary / layout layer.

**Command**: Module Isolation Check
```bash
grep -r "from '@/modules/" src/modules
```
-   **Guarantee**: Ensures NO cross-module imports. Modules must only import from `src/core`, `src/shared`, or their own internal files.

## 9.5. Build Integrity

**Command**: Build
```bash
npm run build
```
-   **Guarantee**: TypeScript types match, no import errors, Next.js optimization succeeds.

## 9.6. Release Gate Rule

**Mandatory Pre-Release Checklist**:

1.  **Architecture**: All `grep` checks must return clean (or expected) results.
2.  **Logic**: `npm run build` must succeed without warnings.
3.  **State**: No "TODO" or "FIXME" comments in critical security paths (`src/core/security`, `src/db`).
4.  **Database**: All migrations must be applied and idempotent.

**Invariant**: NO deployment may proceed if any of the above checks fail.

## 9.7. Business Hierarchy Verification (Strict)

**Command**: RPC-Only Enforcement (No Direct Writes)
```bash
grep -R "from(['\"]companies['\"])" src | grep -E "insert|update|delete"
grep -R "from(['\"]organizations['\"])" src | grep -E "insert|update|delete"
# ... (Repeat for all hierarchy tables)
```
-   **Guarantee**: Ensures all hierarchy mutations go through `SECURITY DEFINER` RPCs.

**Command**: RPC Existence Check
```bash
grep -R "create or replace function public.create_group" src/db/migrations
grep -R "create or replace function public.create_organization" src/db/migrations
grep -R "create or replace function public.create_company" src/db/migrations
```
-   **Guarantee**: verifies that mandatory RPCs are defined in migrations.

**Command**: Hierarchy Force RLS
```bash
grep -R "force row level security" src/db/migrations | grep -E "companies|organizations|projects|service_offerings"
```
-   **Guarantee**: Hierarchy tables are strictly locked down.

-   **Guarantee**: Hierarchy tables are strictly locked down.

## 9.8. 2FA Verification

**Command**: 2FA RPC Security
```bash
grep -R "create or replace function public.*_login_challenge" src/db/migrations
```
-   **Guarantee**: Ensures 2FA RPCs are present.

**Command**: 2FA Middleware Gate
```bash
grep "2fa_session" src/middleware.ts
```
-   **Guarantee**: Middleware must explicitly check the 2FA cookie.

**Command**: Cookie Rotation Check
```bash
grep "cookieStore.set('2fa_session'" src/app
```
-   **Guarantee**: Ensures 2FA cookies are being set/rotated in the application layer.
