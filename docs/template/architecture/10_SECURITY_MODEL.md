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

