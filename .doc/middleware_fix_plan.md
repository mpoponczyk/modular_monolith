
# Middleware Tenant Context Fix

## Goal
Fix "No Active Tenant" error when accessing `/admin/t/[tenantSlug]` routes. The error occurs because the root `AdminLayout` cannot access the `tenantSlug` parameter (nested segment) and falls back to cookies, which may be missing or stale.

## Solution
Update `middleware.ts` to extract the `tenantSlug` from the URL path and set it as a request header `x-tenant-slug`. The `resolveAuthContext` function is already configured to read this header, enabling strict tenant resolution based on the URL.

## Changes

### [middleware.ts](file:///Users/Shared/Modular_Monolith/src/middleware.ts)
- Extract `tenantSlug` from regex match.
- Set `x-tenant-slug` header on the response/request.

## Verification
1.  **Manual Test**:
    - Clear cookies (simulated or assume cleared).
    - Access `/admin/t/test-tenant/dashboard`.
    - `AdminLayout` should resolve `test-tenant` via header.
    - Page should load successfully.

2.  **Audit**:
    - Verify `resolveAuthContext` logs (if enabled) show resolution via header.

## Rollback
- Revert changes to `middleware.ts`.
