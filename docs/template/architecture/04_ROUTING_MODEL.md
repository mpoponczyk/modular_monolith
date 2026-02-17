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
