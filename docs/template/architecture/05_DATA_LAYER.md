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
