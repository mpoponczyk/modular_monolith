
# Menu RPC Fix Implementation Plan

## Goal
Implement a `SECURITY DEFINER` RPC `resolve_menu_structure` to fetch the dynamic menu structure.
This is required to bypass a recursive RLS policy on `company_users` in a compliant way, adhering to the "Trusted RPCs" architecture rule.
Standard Supabase clients trigger the recursion because they enforce RLS. The RPC will run with `search_path=public,extensions,auth` and explicitly check tenant membership before returning data.

## Changes

### 1. Database Migration
**File:** `src/db/migrations/20260219000000_resolve_menu_rpc.sql`
- Define function `resolve_menu_structure(p_tenant_id uuid, p_locale text)`.
- Returns `TABLE (id, order_index, is_enabled, name, items jsonb)`.
- Logic: Joins Sections -> Translations -> Items -> Apps.
- Security: `SECURITY DEFINER`, `Revoke public`, `Grant authenticated`.

### 2. Apply Migration
- Create script `src/scripts/apply_menu_rpc.ts` using `pg` client (Admin access) to execute the SQL.

### 3. Application Code
**File:** `src/core/menu/dynamic.ts`
- Refactor `getDynamicMenuItems` to call `supabase.rpc('resolve_menu_structure', ...)`
- Map the returned JSON structure to `MenuItem[]`.

## Verification
- **Manual**: Refresh Application Library. Info logs should show successful RPC call.
- **Audit**: Verify no `infinite recursion` error in console.
