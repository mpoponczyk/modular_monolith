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
