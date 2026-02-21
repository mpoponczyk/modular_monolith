
# Menu RLS Bypass Plan

## Goal
Resolve `infinite recursion detected in policy for relation "company_users"` error when fetching dynamic menu.
The error is caused by a recursive RLS policy on `company_users` which is triggered by `organization_apps` -> `company_users` check.
Since we lack the Service Role Key to bypass RLS via Supabase Client, and we cannot easily migrate the DB policy, we will use the admin `postgres` user (via `DATABASE_URL`) to fetch menu metadata.

## Changes

### 1. New Infra Module: `src/infra/db/postgres.ts`
- Export a singleton `Pool` from `pg`.
- Configured with `process.env.DATABASE_URL`.

### 2. Refactor `src/core/menu/dynamic.ts`
- Replace `createAuthClient` with `pool.query`.
- Rewrite the 3 Supabase queries as strict SQL queries:
    1. `SELECT id, order_index, is_enabled FROM organization_sections WHERE tenant_id = $1 ...`
    2. `SELECT section_id, name FROM organization_section_translations WHERE tenant_id = $1 ...`
    3. `SELECT osi.id, osi.section_id, ... oa.module_id, oa.is_active FROM organization_section_items osi JOIN organization_apps oa ...` (or separate queries to avoid join complexity if preferred, but SQL join is fine).

## Verification
1.  **Manual Test**: User refreshes the page. The error should disappear.
2.  **Safety**: Ensure strict `tenant_id` filtering in all SQL queries to prevent leakage.

## Rollback
- Revert `src/core/menu/dynamic.ts` to use Supabase Client.
- Delete `src/infra/db/postgres.ts`.
