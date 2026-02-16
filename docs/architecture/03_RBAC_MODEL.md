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
