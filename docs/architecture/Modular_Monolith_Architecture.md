# 1. Architecture Overview

## 1.1. System Structure
The system follows a **Strict Modular Monolith** architecture optimized for multi-tenancy, security, and maintainability.

- **Core (`src/core`)**: Contains shared domain logic, authentication, context resolution, and application ports. It is the backbone of the system.
- **Shared (`src/shared`)**: Cross-cutting presentation concerns (UI components, I18n). strictly decoupled from Core.
- **Modules (`src/modules`)**: functional verticals (e.g., `example-dashboard`). Isolated by strict boundaries.
- **Infrastructure (`src/infra`)**: implementations of Core ports (e.g., Supabase repositories).
- **Application (`src/app`)**: Next.js App Router handling routing, layouts, and page composition.

## 1.2. Key Principles

### Strict Module Isolation
- Modules must not import from other modules.
- Interaction occurs only via the `moduleRegistry` and Core definitions.
- The `ModuleDefinition` contract enforces structure.

### Multi-Tenant Enforcement
- **Database Level**: All data is tenant-scoped via `tenant_id` columns and Row Level Security (RLS).
- **Application Level**: All repositories force explicit `tenantId` filtering.
- **Context Level**: `AuthContext` is resolved deterministically per request.

### Security Model (See Chapter 10)
- **RPC-Only Writes**: All sensitive mutations (Hierarchy, RBAC, 2FA) MUST occur via `SECURITY DEFINER` RPCs. Direct table writes are forbidden.
- **Strict 2FA**: Tenant-aware, DB-backed 2FA enforcement with session rotation.
- **Fail-Closed**: Systems deny access by default unless explicitly granted.
- **RLS as Safety Net**: Application logic filters data, but RLS ensures safety if logic fails.

### Canonical Routing
- Routes are tenant-scoped: `/admin/t/[tenantSlug]/...`.
- Root `/admin` routes strictly redirect or fail if tenant definition is ambiguous.

## 1.3. Architecture Diagram (ASCII)

```
[Browser Request]
      |
      v
[Next.js Middleware/Routing]
      |
      v
[Layout: /admin/t/[slug]] -> [resolveAuthContext] -> [SupabaseTenantRepository]
      |                             |
      |   (Fail if Null)            v
      |                       [DB: Public Schema]
      |
      v
[Module Page] -> [canAccessModule] -> [RBAC Check]
      |
      v
[Module Component] -> [Repositories] -> [Supabase Client (Auth)]
                                                |
                                                v
                                      [DB: RLS Filtered Data]
```

## 1.4. Sources of Truth

The system relies on specific, authoritative sources for its state:

-   **Module Availability**: Defined by `moduleRegistry` + `ModuleDefinition.system.isActive` (Hard Switch).
-   **Tenant Enablement**: Defined by `tenant_modules` table (Tenant-scoped activation).
-   **RBAC Enforcement**: `requiredPermissions` (Static Contract) vs `resolved user permissions` (Dynamic Context).
-   **Tenant Context**: Resolved strictly per request via `resolveAuthContext` (No global/static state).
-   **Canonical Routing**: The URL path `/admin/t/[tenantSlug]` is the only source of truth for the current tenant.

## 1.5. Tenant Resolution Summary

The system uses a strict, deterministic resolution process:

1.  **Source**: `tenantSlug` is derived **ONLY** from the route parameter `/admin/t/:tenantSlug`.
2.  **Validation**: If the slug is provided but invalid (not found/no access) -> **Fail-Closed** (Redirect to Login/404).
3.  **Missing Slug**:
    -   **1 Tenant**: Implicitly resolved (Auto-Redirect to Canonical).
    -   **>1 Tenant**: Ambiguous -> **409 Conflict** (Redirect to Tenant Selection).
    -   **0 Tenants**: No Access -> **Fail** (403/404).
4.  **Constraints**:
    -   No support for `?tenant=` query parameters in UI.
    -   No "default tenant" or "last visited" fallbacks in the core logic (strictly explicit).

## 1.6. Verification Points (High-Level)

Production invariants that must be verified:

1.  **No Server-Admin**: The `service_role` key is strictly forbidden in the request/response flow.
2.  **Explicit Filtering**: All repository methods MUST require `tenantId` and filter by it explicitly.
3.  **RLS Enforcement**: All tenant-scoped tables MUST have RLS enabled and forced.
4.  **Fail-Closed Routing**: Routes must not render if context is invalid.
5.  **Module Isolation**: No cross-module imports allowed; strict boundary enforcement.

## 1.7. Static vs Dynamic State

The system strictly distinguishes between compile-time definitions and runtime state:

-   **Static (Compile-Time)**:
    -   `moduleRegistry`: The immutable catalog of available code modules.
    -   `ModuleDefinition`: Structural contract (routes, metadata).
    -   `system.isActive`: Hard infrastructure switch (commits/deploys).

-   **Dynamic (Runtime / Data)**:
    -   `tenant_modules`: Which tenants have subscribed to which modules.
    -   `role_permissions`: How abstract roles map to granular permissions.
    -   `resolved user permissions`: The effective permission set for a user in a specific tenant to a specific module.

-   **Per-Request (Ephemeral)**:
    -   `resolveAuthContext`: The calculated identity for the current HTTP request.
    -   `tenantSlug`: The context identifier derived from the URL for this specific execution.
    -   `UserContext`: The temporary object holding the resolved permissions for the duration of the request.
# 2. Tenancy Model

## 2.1. Tenant Resolution Strategy

The system employs a strict, deterministic resolution, precedence-based strategy.

**Precedence Order:**
1.  **URL Path (Primary)**: `/admin/t/[tenantSlug]`
    -   This is the **Canonical** source of truth.
    -   If present, other sources are ignored.
    -   **Constraint**: If a slug is present, the system MUST validate that slug directly. It MUST NOT fallback to implicit resolution.
2.  **Header (API/HTMX)**: `x-tenant-slug`
    -   Used for non-navigation requests (API, RPC, background interactions).
    -   **Constraint**: It MUST NOT override a URL path tenantSlug.
    -   **Constraint**: It MUST NOT be used for primary UI routing.
    -   **Validation**: Even when derived from Header, the system **MUST validate membership** via `tenant_users`. Transport presence does not imply access.
3.  **Cookie (Fallback)**: `tenant_slug`
    -   Used for redirecting from root to last visited.
    -   **Validation**: Even when derived from Cookie, the system **MUST validate membership** via `tenant_users`.
4.  **Implicit (Strict)**:
    -   This step runs **ONLY if no tenantSlug is present** in the URL.
    -   Query `tenant_users` for the authenticated user.
    -   **Count = 1**: Auto-select. **System MUST redirect to canonical URL `/admin/t/[resolvedSlug]`.**
        -   **Constraint**: Canonical redirect MUST occur **before rendering any tenant-scoped layout**.
        -   **Constraint**: No module component may render under a non-canonical URL.
    -   **Count > 1**: Ambiguous (Return Null).
    -   **Count = 0**: None (Return Null).

In all cases, the system distinguishes between:
-   **Identity failure** (authentication)
-   **Authorization failure** (membership/permission)
-   **Context ambiguity** (multiple tenants)
Each results in a different deterministic outcome.

## 2.2. Fail-Closed Behavior

The system distinguishes strictly between authentication and resolution failures.

### A. Authentication Failure
-   **Condition**: User is not authenticated (no session).
-   **Action**: Redirect to `/login`.

### B. Tenant Resolution Failure (User Authenticated)
Failed resolution NEVER redirects to `/login` if the user is authenticated.
Tenant resolution consists of **TWO independent checks**:
1.  **Step 1: Slug Existence** (Does a tenant with this slug exist?)
2.  **Step 2: Membership Validation** (Does the user belong to that tenant?)

1.  **Case 1: No Membership (Step 2 Fail)**
    -   **Condition**: Slug exists (Step 1 pass), but User is not a member (Step 2 fail).
    -   **Action**: Return **403 Forbidden** or **404 Not Found** (Security through obscurity preferred).
    -   **Reason**: User exists, but has no access to this specific tenant.

2.  **Case 2: Ambiguous Membership**
    -   **Condition**: User belongs to >1 tenant, no explicit slug provided, implicit resolution blocked.
    -   **Action**: Redirect to `/admin/select-tenant` OR return **HTTP 409 Conflict**.
    -   **Reason**: System cannot deterministically choose a context.

3.  **Case 3: Invalid Slug (Step 1 Fail)**
    -   **Condition**: The requested tenant slug does not exist in the database.
    -   **Action**: Return **404 Not Found**.

## 2.3. Anti-Patterns & Prohibitions

-   **Query Parameters**: `?tenant=` is strictly forbidden for routing to avoid caching/SEO issues.
-   **Cross-Tenant Leaks**:
    -   Repositories MUST enforce `.eq('tenant_id', tenantId)` before selecting.
    -   `resolveAuthContext` verifies that the `user` is actually a member of the requested `tenantSlug` (via `tenant_users` check).

**Security Invariant**:
At no point may tenant context be inferred from client-controlled state alone. Every tenant resolution must be verified against database membership.
# 3. RBAC Model (Strict Permission-Based)

## 3.1. Core Concepts

The system uses a **Permission-Based Access Control** model, not Role-Based (in the application code). Roles exist only in the database to group permissions.

-   **Permission**: Atomic unit of access (e.g., `settings.write`, `users.view`).
-   **Role**: A named collection of permissions (e.g., `Owner`, `Editor`).
-   **User**: Assigned a Role *within* a Tenant.

## 3.2. Data Flow

1.  **Database**:
    -   `permissions`: All available permission strings.
    -   `role_permissions`: Mapping of Role -> Permissions.
    -   `tenant_users`: Assignment of User -> Role (Tenant Scoped).

2.  **Resolution (`getUserContext`)**:
    -   Fetches user's role for the active tenant.
    -   Joins `role_permissions` and `permissions`.
    -   Returns a flat array of permission strings (string[]).
    -   **Constraint**: If resolution fails (no role, invalid join), it returns `[]` (Empty Set).

3.  **Enforcement (`canAccessModule`)**:
    -   Input: `ModuleDefinition` (defines `requiredPermissions`).
    -   Logic: Checks if the User's context (resolved permissions) contains the required permissions.
    -   **Invariant**: `canAccessModule` MUST be evaluated only after successful tenant resolution, membership validation, and module activation checks (system.isActive AND tenant_modules). A module that is inactive MUST NOT be evaluated for permissions. RBAC evaluation MUST NOT occur without a valid tenant-scoped AuthContext.

## 3.3. Permission Semantics

### 1. Logic (AND)
`requiredPermissions` uses strict **AND** logic.
-   Access is granted ONLY if the user holds **ALL** listed permissions.
-   *Exception*: If user holds `*` (Wildcard), all requirements are satisfied.
-   **Evaluation Order**: If userPermissions contains `*`, access MUST be granted before evaluating requiredPermissions. Wildcard short-circuits AND evaluation.

### 2. Empty Requirements
If `requiredPermissions` is **Empty** (`[]`):
-   **Meaning**: **Public within Tenant**.
-   **Effect**: Any authenticated user who is a valid member of the current tenant can access this module.
-   **Constraint**: "Public within Tenant" does **NOT** bypass tenant membership validation. User must still be a valid member of the active tenant.
-   It does **NOT** imply "Deny All".

### 3. Wildcard Behavior (`*`)
-   **Scope**: Tenant-Scoped ONLY.
-   **Definition**: The `*` string is a permission stored in the DB.
-   **Handling**:
    -   **Repository**: Returns `['*']` (raw). It does NOT expand it.
    -   **Enforcement Layer**: `canAccessModule` checks:
        ```typescript
        if (userPermissions.includes('*')) return true;
        ```
-   **Constraint**: There is NO global superadmin. The `*` logic applies only within the isolated tenant context.
-   **Invariant**: Wildcard does not alter the meaning of empty requiredPermissions; empty requirements still require valid tenant membership (Wildcard user must still be a member).

## 3.4. Fail-Closed Guarantees

The system enforces specific behaviors for partial failures:

1.  **Role Resolution Failure**:
    -   If a user is in `tenant_users` but has no role assigned, or the role has no permissions -> `resolvedPermissions` = `[]`.
2.  **Resolution Error**:
    -   If the DB query fails -> `resolvedPermissions` = `[]`.
    -   **Invariant**: If permission resolution fails for any reason, access MUST be denied (treated as having no permissions).
    -   **Invariant**: Under no circumstance may permission resolution failure default to '*' or implicit allow.

## 3.5. Code Contract

-   **Forbidden**: `requiredRoles` array in Module Definition.
-   **Mandatory**: `requiredPermissions` array.
# 4. Routing Model

## 4.1. Canonical Route Structure

The system enforces a strict hierarchical routing model to guarantee context.

**Pattern**: `/admin/t/[tenantSlug]/[[...slug]]`

-   `/admin`: Base admin path.
-   `/t/`: Tenant namespace.
-   `[tenantSlug]`: The explicit Context Identifier.
-   `[[...slug]]`: Module-specific route (Tenant-Agnostic).

## 4.2. Separation of Concerns

-   **Tenant Slug**: Used *exclusively* to resolve `AuthContext` (Tenant + User Permissions).
-   **Module Slug**: Used *exclusively* to resolve the `Module` from the `registry`.
-   **Independence**: `resolveRoute` does not know or care about the tenant. It maps `['settings', 'users']` to the Settings Module component.

## 4.3. Fail-Closed Root

The root path `/admin/[[...slug]]` (without `/t/`) serves only as a **Dispatcher**.

-   Behaviors:
    1.  **Implicit Resolution**: Tries to find a single valid tenant for the user.
    2.  **Redirect**: If found -> Redirects to Canonical `/admin/t/[slug]`.
    3.  **Fail**: If ambiguous or none -> Redirects to Login or 404.
-   **No UI**: This route does not render the admin UI directly. It enforces strict canonicalization.

## 4.4. Database Independence

Routing logic (mapping URL -> Component) is static (defined in Registry code). It does NOT depend on a database call. This ensures the routing structure is deterministic and high-performance. Database checks happen only for *Access Control* (Can this user see this route?), not for *Resolution* (Does this route exist?).

## 4.5. Activation & Authorization Order

**Evaluation Order per Request:**

0.  **`resolveAuthContext` (Tenant + UserContext)** MUST succeed.
    -   Canonical tenant redirect (if implicit resolution = 1 tenant) MUST occur BEFORE `resolveRoute`.
    -   No module resolution may occur without a valid tenant-scoped `AuthContext`.
1.  **`resolveRoute`** (static module resolution via `moduleRegistry`).
2.  **Module Activation Check** (`system.isActive` + `tenant_modules`).
3.  **RBAC Check** (`canAccessModule`).
4.  **Rendering**.

**Security Invariant:**
-   Routing MUST NOT leak activation state or permission state.
-   Inactive modules and unauthorized modules MUST both return **404**.
-   No "Feature Disabled" UI may render for unauthorized tenants.
-   **Activation and RBAC checks MUST never execute with undefined `tenantId` or undefined `UserContext`.**
# 5. Data Layer

## 5.1. Layering Strategy

The data layer follows a strict Port/Adapter pattern to decouple Core business logic from Infrastructure specifics.

-   **Ports (`src/core/application/ports`)**: TypeScript Interfaces defining *what* is needed (e.g., `ITenantRepository`).
-   **Adapters (`src/infra/repositories`)**: Implementations using specific technologies (e.g., `SupabaseTenantRepository` using `supabase-js`).

## 5.2. Strict Enforcement Rules

### 1. Tenant-Scoped Table Definition
A **tenant-scoped table** is any table containing a `tenant_id` column.
All queries against such tables MUST include explicit `tenant_id` filtering.

### 2. Explicit Tenant Filtering
**Invariant**: No query touching a tenant-scoped table may execute without an explicit `tenant_id` equality constraint bound to it.
Implicit reliance on RLS is forbidden.

-   The `tenant_id` constraint MUST be applied at the SQL level.
-   Tenant filtering MUST NOT occur in application memory after query execution.

```typescript
// Correct
supabase.from('table').select().eq('tenant_id', tenantId);

// Prohibited
supabase.from('table').select(); // Implicit reliance on RLS is forbidden
// Prohibited
data.filter(d => d.tenant_id === tenantId); // In-memory filtering prohibited
```

### 3. Repository Boundary Rule
-   Repositories MUST receive `tenantId` as an explicit argument.
-   Repositories MUST NOT infer `tenantId` from global context or `resolveAuthContext` internally.
-   Tenant context must be injected from the application layer.

### 4. Mandatory Tenant ID Validation
Repositories methods must Throw Error if `tenantId` argument is undefined or null.

### 5. Prevent Unscoped Repository Methods
-   Repositories MUST NOT expose methods that operate on tenant-scoped tables without requiring `tenantId`.
-   Unscoped variants (e.g., `getAllUsers()`) are strictly forbidden.

### 6. Service Role Prohibition
The application code MUST use `createAuthClient()` (User-Scoped).
**Prohibited**: `createAdminClient()` / `service_role` key usage in the request flow.

### 7. RLS as Safety Net
While the application logic (explicit filtering) is the primary defense, **Row Level Security (RLS)** is strictly enabled on the database to act as a fail-safe backstop. If the repo fails to filter, the DB prevents cross-tenant leakage.

## 5.3. RPC Boundaries
Complex mutations (like Edit Locks) are encapsulated in PostgreSQL Functions (RPCs) to ensure atomicity and strict permission checking that might be hard to guarantee with multiple client-side calls.
# 6. RLS Security Model

## 6.1. Policy Architecture

The system enforces **Row Level Security (RLS)** on all sensitive tables.

-   **Mode**: `FORCE ROW LEVEL SECURITY` (Strict). Table owners cannot bypass RLS.
-   **Predicate**: Membership Check via `tenant_users`.

**Standard Policy Pattern (Select):**
```sql
USING (
  exists (
    select 1 from public.tenant_users
    where tenant_id = current_table.tenant_id
    and user_id = auth.uid()
  )
)
```

## 6.2. Write Protection (`edit_locks`)

For the critical `edit_locks` table, security is managed via **RPC-Only Mutations**.

1.  **Table Permissions**:
    -   `authenticated`: `GRANT SELECT` ONLY.
    -   `REVOKE` INSERT/UPDATE/DELETE.
2.  **Implication**: Even if RLS allows a write, the standard SQL privileges block it. This forces writes to go through approved RPCs.

## 6.3. Trusted RPCs (Security Definer)

Specific operations (`acquire_edit_lock`, `release_edit_lock`) run with `SECURITY DEFINER` privileges to perform operations that users shouldn't do directly (or to ensure atomic logic).

**Safety Measures:**
1.  **Search Path**: Explicitly set to `public, auth` to prevent search path hijacking.
2.  **Explicit Membership Check**: The function manually re-verifies `tenant_users` membership at the very start of execution.
    ```sql
    if not exists (select 1 from public.tenant_users ...) then raise exception ...
    ```
3.  **Explicit Revoke**: `REVOKE ALL` from `public, anon` ensures only authenticated users can trigger the function.

## 6.4. Trust Boundaries

1.  **Application**: Untrusted. Can request anything.
2.  **Repository**: Trusted to format request, but strictly scoped to User Auth.
3.  **Database (RLS)**: Trusted Final Enforcer. returns empty sets if App requests wrong tenant.
4.  **RPC**: Trusted Atomic Unit. Verified by SQL logic.
# 7. Edit Locks Model (Phase 3 Strict)

## 7.1. Concept
Provides mutually exclusive, short-lived locks on entities to prevent concurrent edit conflicts in a multi-user environment.

## 7.2. Schema (`edit_locks`)
-   **Key**: `(tenant_id, entity_type, entity_id)`
-   **Owner**: `locked_by` (User UUID)
-   **Time**: `locked_at` (Acquisition/Refresh), `expires_at` (Absolute Validity)

### System Invariant
**Invariant**: At most one active lock per `(tenant_id, entity_type, entity_id)`.
This uniqueness is structurally enforced by:
1.  **Composite Primary Key**: The database schema physically prevents duplicate rows for the same entity.
2.  **Row-Level Locking**: PostgreSQL serialization ensures concurrent attempts queue for the same row.
3.  **Atomic Upsert**: `INSERT ... ON CONFLICT` provides atomic "check-and-set" semantics.

## 7.3. Lock Acquisition Logic (RPC)

The `acquire_edit_lock` RPC implements an atomic "Check-and-Set" or "Steal-if-Expired" logic.

**State Transition Table:**

| Existing State | User Checks | Override? | Result |
| :--- | :--- | :--- | :--- |
| **None** | - | - | **Acquired** (Insert) |
| **Locked (Expired)** | - | - | **Acquired** (Takeover) |
| **Locked (Active)** | Same User | - | **Refreshed** (Extend TTL) |
| **Locked (Active)** | Diff User | False | **Denied** (Fail) |
| **Locked (Active)** | Diff User | True | **Acquired** (Steal) |

### RBAC Boundary Clarification
-   **RPC Responsibility**: The RPC strictly validates **Tenant Membership** (`tenant_id` exists in `tenant_users`).
-   **App Responsibility**: The Application Layer MUST verify **RBAC Permissions** (e.g., `locks.override` or super-admin powers).
-   **Security Boundary**: The RPC does **NOT** evaluate `locks.override` permissions. It trusts the `override` boolean passed by the App (which is why the App must authorize it first).

## 7.4. Operational Guarantees

### Deadlock Safety
Deadlocks are structurally impossible for this feature because:
1.  **Single Row Context**: Operations affect exactly one row in one table (`edit_locks`) via Primary Key.
2.  **No Multi-Table Writes**: The RPC does not write to other tables.
3.  **No Lock Chains**: There are no dependencies on other locks.

### Expiration Model
-   **Lazy Expiration**: Expired locks are **NOT** proactively cleaned by a background worker.
-   **Overwrite Logic**: They are lazily overwritten by the next `acquire` attempt.
-   **Correctness**: No background job is required for system correctness.

### Clock Source
-   **Single Source of Truth**: Lock validity is based **exclusively** on the Database Server time (`now()`).
-   **Skew Safety**: Application server clock skew does not affect lock correctness or expiration logic.

## 7.5. Release Logic

`release_edit_lock` is safe/idempotent:
-   Deletes current lock **IF AND ONLY IF** `locked_by` matches `auth.uid()`.
-   Prevents users from unlocking each other's work (unless using an override path in `acquire`, but explicit release is strict).
# 8. Failure Modes & Handling

## 8.1. Authorized Resolution Failures

| Scenario | Detection | System Behavior |
| :--- | :--- | :--- |
| **Unauthenticated** | No session found | **Redirect** to `/login`. |
| **Invalid Slug (Step 1 Fail)** | Slug not found in `tenants` table | **Return 404 Not Found**. (Never redirect authenticated users). |
| **No Membership (Step 2 Fail)** | Tenant exists, but user not in `tenant_users` | **Return 404 Not Found** or **403 Forbidden**. |
| **Ambiguous Implicit** | No slug provided, `tenant_users` count > 1 | **Redirect** to `/admin/select-tenant` OR **409 Conflict**. |
| **No Tenants (Implicit)** | No slug provided, `tenant_users` count = 0 | **Return 403 Forbidden** or **404 Not Found** (Fail-Closed). |

## 8.2. Authorization, Activation & Routing Failures

| Scenario | Detection | System Behavior |
| :--- | :--- | :--- |
| **Route Not Found** | `resolveRoute` returns null | **Return 404 Not Found**. |
| **Inactive Module** | `system.isActive` check fails | **Return 404 Not Found**. (Prevent state leakage). |
| **Tenant Disabled** | `tenant_modules` check fails | **Return 404 Not Found**. (Security through obscurity). |
| **RBAC Denied** | `canAccessModule` returns false | **Return 404 Not Found**. (Security through obscurity). |
| **Invariant Failure** | Undefined `tenantId` / `UserContext` | **Throw 500 Error**. (Strict Safety boundary). |

## 8.3. Data Access Failures

| Scenario | Detection | System Behavior |
| :--- | :--- | :--- |
| **RLS Violation** | Query returns empty set (After Explicit Filter) | Application treats as "Not Found" (`null`). |
| **Missing TenantID** | Repository Check | **Throw Error**. (Prevents Query Execution). |
| **Unscoped Method** | Method Call Without TenantID | **Throw Error**. (Strict Prohibition). |
| **DB Unreachable** | Supabase Client Error | **Throw Error** / 500 Page. |

> **Invariant**: Empty result set MUST only be treated as "Not Found" after explicit tenant filtering is applied. An empty result from an unscoped query is a critical security failure, not a 404.

## 8.4. Edit Lock Failures

| Scenario | Detection | System Behavior |
| :--- | :--- | :--- |
| **Lock Held (Business Logic)** | RPC returns `success: false` | UI enters **Read-Only Mode**. (Expected State). |
| **RPC Error** | Repository catch | **Throw Error**. UI prevents editing (Safety). |
| **Invalid TTL** | RPC Exception | **Throw Error**. Request Rejected. |
| **Concurrent Race** | DB Row Lock | Requests queue; winner resolved deterministically by DB. |

## 8.6. 2FA & Session Failures


| Scenario | Detection | System Behavior | Evidence Location |
| :--- | :--- | :--- | :--- |
| **Cookie Missing** | Middleware / Guard | **Redirect** to `/admin/t/[slug]/2fa?reason=missing_cookie`. | `src/core/security/serverGuard.ts:23` |
| **Invalid Signature** | `verifyTwoFaCookie` fails | **Redirect** to `/admin/t/[slug]/2fa?reason=invalid_signature`. | `src/core/security/serverGuard.ts:30` |
| **Tenant Mismatch** | Payload `tenantId` != Request | **Redirect** to `/admin/t/[slug]/2fa?reason=tenant_mismatch`. | `src/core/security/serverGuard.ts:36` |
| **Session Revoked** | DB Check (`validate_twofa_session`) | **Redirect** to `/admin/t/[slug]/2fa?reason=session_revoked`. | `src/core/security/serverGuard.ts:47` |
| **Token Expired** | JWT/Cookie TTL | **Redirect** to Login. | Standard Auth Flow. |


> **Note**: "Lock Held" is a controlled business outcome, not a system failure condition.

## 8.5. General Philosophy

The system adheres to **Fail-Closed**.
-   If it's not explicitly allowed, it represents an error/attack.
-   It is better to show an error screen than to leak data or allow corrupt writes.
-   Ambiguity is treated as a security risk.
# 9. Verification Model

Strict automated commands verify the architectural invariants. These commands must pass before any release.

## 9.1. Security Boundary Verification

**Command**: Server-Admin Leak Check
```bash
! grep -r "server-admin" src/app src/core src/infra | grep -v "seed" | grep -v "migration"
```
-   **Guarantee**: The powerful `service_role` key is NOT used in the application runtime flow. It is restricted to seeding/migrations.

**Command**: Admin Client Prohibition Check
```bash
! grep -r "createAdminClient" src/app src/modules src/core
```
-   **Guarantee**: Strictly prohibits `createAdminClient` usage in runtime code.

**Command**: Direct Write Check (`edit_locks`)
```bash
! grep -R "from(['\"]edit_locks['\"])" -n src | grep -E "insert|update|delete"
```
-   **Guarantee**: No application code bypasses the RPCs to modify locks directly.

**Command**: In-Memory Filtering Prevention
```bash
! grep -r "\.filter(.*tenant_id" src
```
-   **Guarantee**: Ensures no `tenant_id` filtering happens in application memory (after query execution). Relies on repository-level SQL constraints.

**Command**: Critical TODO Check
```bash
! grep -rE "TODO|FIXME" src/core/security src/db/migrations
```
-   **Guarantee**: No unresolved technical debt in critical security paths.

**Command**: Canonical Routing Enforcement
```bash
! grep -R --fixed-strings "?tenant=" src/app src/modules
! grep -r "searchParams.get('tenant')" src/app src/modules
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
! grep -r "requiredRoles" src/modules
```
-   **Guarantee**: Ensures modules rely on Permissions, not Roles.

**Command**: Module Authorization Boundary
```bash
! grep -R "canAccessModule" -n src/modules
```
-   **Guarantee**: Modules cannot self-authorize. `canAccessModule` must only be used in the routing boundary / layout layer.

**Command**: Module Isolation Check
```bash
! grep -r "from '@/modules/" src/modules
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

**Command**: No Direct SQL Writes
```bash
! grep -R "from(['\"]companies['\"])" src | grep -E "insert|update|delete"
! grep -R "from(['\"]organizations['\"])" src | grep -E "insert|update|delete"
! grep -R "from(['\"]projects['\"])" src | grep -E "insert|update|delete"
! grep -R "from(['\"]service_offerings['\"])" src | grep -E "insert|update|delete"
```
-   **Guarantee**: Hierarchy tables are strictly locked down.

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

## 9.8. 2FA Verification (Strict Evidence)

**Command**: HEX Signature & Timing Safe Check
```bash
grep "bufferToHex" src/core/security/twofaCookie.ts
grep "crypto.subtle.verify" src/core/security/twofaCookie.ts
! grep "Buffer.from" src/core/security/twofaCookie.ts
```
-   **Guarantee**: Ensures signatures are HEX encoded, compared using Web Crypto, and NO Node.js Buffer usage.

**Command**: Payload Tenant Binding Check
```bash
grep "tenantId: string;" src/core/security/twofaCookie.ts
```
-   **Guarantee**: Payload structure MUST include strict `tenantId`.

**Command**: Guard Enforcement Check
```bash
grep "requireTwoFaVerified" src/app/\(admin\)/admin/t/\[tenantSlug\]/\[\[...slug\]\]/page.tsx
```
-   **Guarantee**: The `TenantPage` component enforces 2FA verification before rendering.

**Command**: Transport Gate Check
```bash
grep "verifyTwoFaCookie" src/middleware.ts
```
-   **Guarantee**: Middleware performs a transport-level check to fail fast.

**Command**: No Global 2FA Route
```bash
[ ! -d src/app/2fa ] && echo "PASS: No global 2fa route"
```
-   **Guarantee**: 2FA routes are strictly tenant-scoped under `/admin/t/[slug]/2fa`.

**Command**: RPC Existence & Security Check
```bash
grep -ir "create or replace function public.validate_twofa_session" src/db/migrations
grep -ir "set search_path = public, extensions, auth" src/db/migrations
```
-   **Guarantee**: The `validate_twofa_session` RPC exists and uses strict search path.

## 9.9. I18n Verification (Strict)

**Command**: Paranoid I18n Audit
```bash
./src/scripts/verify_i18n_strictness.sh
```
-   **Guarantee**: Enforces the following invariants:
    1.  **Core Purity**: `src/core` never imports `src/shared/i18n`.
    2.  **Module Isolation**: `src/shared/i18n` never imports module-specific locales.
    3.  **No Middleware Logic**: Middleware does not resolve or inject locales (Auth only).
    4.  **Zero Dependencies**: No `i18next` or external libraries allowed.

**Command**: Manual Core Check
```bash
! grep -r "from '@/shared/i18n'" src/core
```
-   **Guarantee**: Double-check that Core remains 100% translation-agnostic.


# 10. Security Model

## 10.1. Authentication & Identity

The system utilizes **Supabase Auth** as the identity provider, but enforces strict architectural isolation between Identity (Who you are) and Access (What you can do).

### Core Components
-   **Identity Provider**: Supabase Auth (handles JWTs, emails, passwords).
-   **Session Cookie**: `sb-` tokens managed by Supabase helpers.
-   **Transport Gate**: `src/middleware.ts` validates the presence of auth tokens before any application logic runs.

### Invariant
> **No Implicit Access**: Being authenticated with Supabase grants **zero** permissions. It only establishes Identity. All access requires explicit Tenant Membership checks.

## 10.2. Tenant Resolution Flow

Tenant Context is **never** global. It is resolved strictly per request based on the URL.

1.  **URL Parsing**: `/admin/t/[tenantSlug]/...`
2.  **Resolution**: `resolveAuthContext` looks up the Tenant ID by Slug.
3.  **Membership Check**: Verifies the user exists in `tenant_users`.
4.  **Fail-Closed**: If any step fails -> 404/403 (No "default tenant" fallback).

## 10.3. Strict 2FA (Variant A)

For high-security operations, the system enforces a secondary, tenant-scoped authentication layer.

### Architecture

-   **Scope**: Per-Tenant. (Auth in Tenant A does NOT authorize Tenant B).
-   **Route**: `/admin/t/[tenantSlug]/2fa` (Canonical Interface).
-   **Persistence**: `2fa_session` cookie (Signed, HTTPOnly, Secure, SameSite=Lax).
-   **Storage**: DB-backed `twofa_sessions` table (Allows server-side revocation).

### The Flow

1.  **User Access**: Code attempts to access a protected route.
2.  **Middleware Gate**: Checks for valid `2fa_session` cookie matching `tenantSlug`.
    *   **Evidence**: `src/middleware.ts` (Lines 34-42) - Reads cookie, verifies signature, checks slug.
    *   **Heuristic**: Middleware does **NOT** query the DB. It only parses the signed cookie.
3.  **Challenge**: If invalid/missing, redirects to `/admin/t/[tenantSlug]/2fa`.
4.  **Creation**: User requests code -> `create_login_challenge` (RPC) -> Email.
    *   **Evidence**: `src/app/(admin)/admin/t/[tenantSlug]/2fa/actions.ts` calls RPC `create_login_challenge`.
5.  **Verification**: User submits code -> `verify_login_challenge` (RPC).
    *   **Evidence**: `src/app/(admin)/admin/t/[tenantSlug]/2fa/actions.ts` calls RPC `verify_login_challenge`.
6.  **Binding**: Server issues generic signed cookie using DB Session ID.
    *   **Evidence**: `src/app/(admin)/admin/t/[tenantSlug]/2fa/actions.ts` (Lines 62-83) - Sets `2fa_session` cookie.

### Security Invariants

1.  **RPC-Only Writes**:
    *   `create_login_challenge` and `verify_login_challenge` are `SECURITY DEFINER` functions.
    *   `search_path` is strictly locked to `public, extensions, auth`.
    *   Public access is revoked; only `authenticated` role can execute.

2.  **Dual-Layer Verification**:
    *   **Layer 1 (Transport)**: Middleware checks cookie signature and tenant slug.
        *   **Evidence**: `src/middleware.ts` -> `verifyTwoFaCookie`.
    *   **Layer 2 (Truth)**: `serverGuard` checks DB for session validity (Revocation/Replay).
        *   **Evidence**: `src/core/security/serverGuard.ts` calls `validate_twofa_session` RPC.
        *   **Enforcement**: `src/app/(admin)/admin/t/[tenantSlug]/[[...slug]]/page.tsx` calls `requireTwoFaVerified`.

3.  **Crypto & Payload**:
    *   **HMAC SHA256**: Signatures are HEX encoded.
        *   **Evidence**: `src/core/security/twofaCookie.ts` -> `digest('hex')`.
    *   **Timing Safe**: Comparisons use `timingSafeEqual`.
        *   **Evidence**: `src/core/security/twofaCookie.ts` -> `timingSafeEqual`.
    *   **Payload**: Contains `tenantId`, `tenantSlug`, `userId`, `sessionId`, `iat`, `exp`.
        *   **Evidence**: `src/core/security/twofaCookie.ts` (Interface `TwoFaPayload`).

4.  **Session Rotation**:
    *   Every successful verification **invalidates all previous 2FA sessions** for that user/tenant.
        *   **Evidence**: `verify_login_challenge` RPC (SQL) updates `revoked_at` for old sessions.
        *   **Logic**: `UPDATE public.twofa_sessions SET revoked_at = now() ...`.

## 10.4. RBAC Separation

The system enforces a strict "No Inheritance" model for RBAC.

### Tenant RBAC (`tenant_roles`)
-   Controls access to tenant-level modules (e.g., Dashboard, Settings).
-   managed via `tenant_users` -> `tenant_roles` -> `permissions`.

### Company RBAC (`company_roles`)
-   Controls access to specific Business Hierarchy nodes.
-   **Completely Independent** of Tenant Roles.
-   Being a Tenant Admin does **not** automatically grant Company Admin rights (Explicit Grant required).
-   Managed via `company_users`.

### RPC-Only Mutation
-   All RBAC changes (Add User, Grant Permission) MUST go through strict RPCs.
-   Direct `INSERT` into permission tables is blocked by RLS.

## 10.5. Fail-Closed Principles

-   **Missing Cookie**: Redirect to Login/2FA.
-   **Invalid Slug**: 404 Not Found.
-   **Revoked Session**: DB check inside the application context fails -> Redirect.
-   **Middleware**: If it can't verify -> It denies.

## 10.6. I18n Isolation

The translation system is strictly a **Presentation Layer** concern and must **never** intersect with Security Logic.

1.  **No Auth Coupling**: I18n logic does not have access to the `AuthContext` or `UserContext`. It reads raw cookies only.
2.  **No RBAC Coupling**: "Access Denied" messages are translated **after** the security check fails. The check itself is language-agnostic.
3.  **Core Purity**: The `src/core` domain model uses Error Codes (e.g., `AUTH_DENIED`, `INVALID_SLUG`), never translated strings.

# 11. Organization Menu & Variants System (Strict)

## 11.1. Conceptual Model & SaaS Boundary

The Organization Menu System defines the **SaaS Boundary** within the Multi-Tenant architecture. It strictly enforces the hierarchy: **Tenant > Organization > Section > App**.

### 11.1.1. Tenant vs. Organization Scope
*   **Tenant as Container**: The Tenant is a passive container for data and users. It **DOES NOT** define the application structure, menu, or available features.
*   **Organization as SaaS Universe**: The Organization is the active SaaS boundary. It defines:
    *   Which Modules are active.
    *   How the Menu is structured (Sections).
    *   Which Languages are supported.
    *   Default Layouts (Variants).
*   **No Downstream Overrides**: Menu structure is defined **exclusively** per `(tenant_id, organization_id)`. Companies and Projects **CANNOT** define or override menu structure.

### 11.1.2. Code vs. Data Authority
*   **ModuleRegistry (Code)**: The immutable source of truth for *available* software capabilities (Modules). It defines what *can* exist.
*   **Organization Apps (Data)**: The mutable record of what *is activated* for a specific Organization.
*   **Module Integrity Rule**: An App cannot be activated if it does not exist in the `ModuleRegistry`.

### 11.1.3. Relational Decomposition (Strict Contract)
The system rejects JSON blob storage for structure. It enforces a Mandatory Relational Decomposition Pattern:

*   **Object A (Section)**: `organization_sections`
*   **Object B (App Activation)**: `organization_apps`
*   **Relation A↔B (Link Item)**: `organization_section_items`
*   **Translation A_t**: `organization_section_translations`
*   **Translation B_t**: `organization_app_translations`

**Invariants**:
*   Apps **MUST** exist in **Object B** before being placed in **Relation A↔B**.
*   Variants **MUST NOT** replace the A↔B link table.
*   Decomposition is **mandatory**; no structural shortcut allowed.

---

## 11.2. Administrative Responsibility Model

### 1. Super Admin (System Operator)
*   **Capabilities**: Define `ModuleRegistry`, Block Modules System-wide (`organization_module_overrides`).
*   **Scope**: Cross-Tenant.

### 2. Organization Owner (Admin)
*   **Capabilities**:
    *   **Structure**: Manage Sections (Create/Edit/Disable).
    *   **Activation**: Activate/Deactivate Apps.
    *   **Linkage**: Link Apps to Sections.
    *   **Ordering**: Define Base Order of Sections and Apps.
    *   **Global Variants**: Create/Edit Organization-wide Variants.
    *   **Defaults**: Set Global Default Variant & Language.
*   **Scope**: Strict Organization Boundary.

### 3. End User (Member)
*   **Capabilities**:
    *   **Local Variants**: Create/Edit private User Variants.
    *   **Preferences**: Set "User Default Variant".
    *   **Selection**: Switch "Active Variant" for session.
    *   **Visibility**: Sees only sections/apps permitted by their RBAC.
*   **Scope**: Strict User/Organization Boundary.

---

## 11.3. Invariants & Isolation Rules

### 11.3.1. The Structural Gate Invariant
**An App must pass ALL structural gates before being visible:**
`System Block` → `Activation` → `Section Membership` → `RBAC` → `Variant Visibility`

Any failure results in the App being strictly invisible.

### 11.3.2. Variant Limitations (Strict Phase 1)
**A Variant cannot introduce structural nodes.**
*   **Base Structure** (Sections + Activation + A↔B) is the **only canonical structural layer**.
*   Variants are **sparse overlays** for **App Visibility** and **App Ordering within Sections**.
*   **Section Reordering**: NOT SUPPORTED in Variants. Sections always appear in their Base Structure order.
*   A Variant **MUST NOT**:
    *   Introduce new apps or sections.
    *   Move apps between sections.
    *   Bypass RBAC or System Blocks.

### 11.3.3. Security & RPC-Only Resolution
*   **RPC Authority**: Menu structure MUST be resolved exclusively via `resolve_menu_structure`.
*   **No Client Authority**: The Client **MUST NEVER** inject RBAC permissions (e.g., `p_allowed_modules` is FORBIDDEN). RBAC must be resolved server-side.
*   **No Direct Writes**: All mutations MUST occur via `SECURITY DEFINER` RPCs. Tables are `REVOKE ALL` from public.

### 11.3.4. Fail-Closed Principles
*   **Zero Structure**: If resolution yields 0 sections, return `[]`. No implicit default.
*   **System Block**: Overrides everything.
*   **Translation**: If translation is missing, return **NULL** (UI handles fallback). Database MUST NOT emit "MISSING_TRANS" markers.

---

## 11.4. Menu Resolution Algorithm (Authoritative)

The `resolve_menu_structure` RPC MUST implement this pipeline:

1.  **System Block** (Super Admin)
    *   Exclude `module_id` in `organization_module_overrides` (`is_blocked=true`).

2.  **App Activation** (Organization)
    *   Include only `organization_apps` with `is_active=true`.

3.  **Base Structure Assembly**
    *   Join `organization_sections` ↔ `organization_section_items` ↔ `organization_apps`.
    *   Filter `is_enabled=true`.

4.  **RBAC Filtering** (Internal Security)
    *   **Strict Rule**: Permissions are resolved **internally** by joining `auth.permissions` (or equivalent).
    *   **Input**: `auth.uid()`.
    *   **Logic**: Filter Apps based on server-side permission check.
    *   *Note*: If internal RBAC tables are not ready, default to "All Active Apps Visible to Members" (Fail-Open for members, Fail-Closed for non-members). **NEVER** accept client input.

5.  **Variant Selection** (Precedence)
    1.  **Active Session** (Arg `p_active_variant_id`).
    2.  **User Default** (`user_variant_preferences`).
    3.  **Global Default** (`organization_menu_variants`).
    4.  **Base Structure** (Null).

6.  **Variant Application** (Overlay)
    *   If Variant ID exists:
        *   Join `organization_menu_variant_items`.
        *   **Hide**: Exclude if `is_hidden=true`.
        *   **App Reorder**: Use `variant_items.order_index` for Apps within Sections.
    *   **Strictness**: Sections use Base Order. Apps without variant entry inherit Base Order.

7.  **Pruning & Cleanup**
    *   Remove empty Sections.
    *   Return JSONB.

---

## 11.5. Structural Tables (Reference)

### Category 1: Base Structure
*   `organization_sections`: (id, tenant_id, org_id, order_index, is_enabled)
*   `organization_section_items`: (id, tenant_id, org_id, section_id, app_id, order_index)

### Category 2: Activation
*   `organization_apps`: (id, tenant_id, org_id, module_id, is_active)

### Category 3: Translations
*   `organization_languages`, `organization_section_translations`, `organization_app_translations`.

### Category 4: Variants
*   `organization_menu_variants`: (id, tenant_id, org_id, is_global, is_default, owner_user_id)
*   `organization_menu_variant_items`: (id, tenant_id, org_id, variant_id, section_id, app_id, order_index, is_hidden)
    *   *Note*: `app_id` is NOT NULL (Section reorder not supported).

### Category 5: Preferences
*   `user_variant_preferences`: (user_id, org_id, variant_id)

### Category 6: Overrides
*   `organization_module_overrides`: (org_id, module_id, is_blocked)

---

## 11.6. Structural Integrity Guarantees

1.  **Composite Scope**: All FKs MUST include `(tenant_id, organization_id)`.
2.  **One Global Default**: Unique Index on `organization_menu_variants` (org_id, is_global=true, is_default=true).
3.  **One User Default**: Unique Index on `user_variant_preferences` (user_id, org_id).
4.  **A/B Separation**: `link_app_to_section` RPC MUST fail if App is not in `organization_apps`.
5.  **Strict Isolation**: No cross-org references allowed.
