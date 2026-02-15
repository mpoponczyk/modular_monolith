-- ⚠️ DEV ONLY – NEVER RUN IN PRODUCTION ⚠️
-- This script destroys all data and tables.
-- Use with extreme caution.

drop function if exists public.enforce_tenant_user_role_consistency cascade;
drop function if exists public.set_updated_at cascade;
drop table if exists public.tenant_modules cascade;
drop table if exists public.tenant_users cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.permissions cascade;
drop table if exists public.roles cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tenants cascade;
