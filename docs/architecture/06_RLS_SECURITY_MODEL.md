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
