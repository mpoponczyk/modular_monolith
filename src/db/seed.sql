-- STRICT SEED DATA (Minimal Bootstrap)

-- 1. Create System Tenant
insert into public.tenants (id, name, slug, status)
values (
    gen_random_uuid(),
    'System',
    'system',
    'active'
) on conflict (slug) do nothing;

-- 2. Create Owner Role for System Tenant
insert into public.roles (id, tenant_id, name, description)
select 
    gen_random_uuid(),
    id as tenant_id,
    'Owner',
    'Tenant Superuser'
from public.tenants where slug = 'system'
on conflict (tenant_id, name) do nothing;

-- 3. Create Global Wildcard Permission
-- Note: Permission definition is global, but its assignment is strictly tenant-scoped via roles.
insert into public.permissions (id, name, description)
values (
    gen_random_uuid(),
    '*',
    'Tenant-scoped Superuser Permission'
) on conflict (name) do nothing;

-- 4. Assign Permission to Role
insert into public.role_permissions (role_id, permission_id)
select 
    r.id as role_id,
    p.id as permission_id
from public.roles r
cross join public.permissions p
where r.name = 'Owner' 
and r.tenant_id = (select id from public.tenants where slug = 'system')
and p.name = '*'
on conflict (role_id, permission_id) do nothing;

-- 5. Create Seed User (Placeholder - Requires Manual Update with Real User ID)
-- DO NOT RUN AUTOMATICALLY IN PRODUCTION WITHOUT SETTING ID
/*
insert into public.profiles (id, full_name)
values ('THE_REAL_USER_ID', 'System Admin')
on conflict (id) do nothing;

insert into public.tenant_users (tenant_id, user_id, role_id)
select 
    t.id as tenant_id,
    'THE_REAL_USER_ID' as user_id,
    r.id as role_id
from public.tenants t
join public.roles r on r.tenant_id = t.id and r.name = 'Owner'
where t.slug = 'system'
on conflict (tenant_id, user_id, role_id) do nothing;
*/
