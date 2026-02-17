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
