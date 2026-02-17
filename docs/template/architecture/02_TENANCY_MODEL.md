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
