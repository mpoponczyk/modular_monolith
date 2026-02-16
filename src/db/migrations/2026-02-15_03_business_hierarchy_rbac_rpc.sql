-- Business Hierarchy v2 RBAC RPC Suite (Strict)
-- Implements: RPC-Only Write Model for Company RBAC
-- Context: SECURITY DEFINER, search_path = public, auth

begin;

-- ==============================================================================
-- 6. Company RBAC RPCs
-- ==============================================================================

create or replace function public.create_company_role(p_tenant_id uuid, p_company_id uuid, p_name text) returns uuid
security definer set search_path = public, auth
as $$
declare
  v_role_id uuid;
begin
  -- Check Company Admin (Hardcoded role name 'Admin' for now, or check explicit permission)
  if not exists (
    select 1 from public.company_users cu
    join public.company_roles cr on cr.id = cu.role_id
    where cu.company_id = p_company_id 
    and cu.user_id = auth.uid() 
    and cu.tenant_id = p_tenant_id
    and cr.name = 'Admin'
  ) then
    raise exception 'Access Denied: Must be Company Admin';
  end if;

  insert into public.company_roles (tenant_id, company_id, name)
  values (p_tenant_id, p_company_id, p_name)
  returning id into v_role_id;
  
  return v_role_id;
end;
$$ language plpgsql;
revoke all on function public.create_company_role(uuid, uuid, text) from public, anon;
grant execute on function public.create_company_role(uuid, uuid, text) to authenticated;

create or replace function public.delete_company_role(p_tenant_id uuid, p_company_id uuid, p_role_id uuid) returns void
security definer set search_path = public, auth
as $$
begin
  -- Check Company Admin
  if not exists (
    select 1 from public.company_users cu
    join public.company_roles cr on cr.id = cu.role_id
    where cu.company_id = p_company_id 
    and cu.user_id = auth.uid() 
    and cu.tenant_id = p_tenant_id
    and cr.name = 'Admin'
  ) then
    raise exception 'Access Denied: Must be Company Admin';
  end if;

  delete from public.company_roles where id = p_role_id and company_id = p_company_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.delete_company_role(uuid, uuid, uuid) from public, anon;
grant execute on function public.delete_company_role(uuid, uuid, uuid) to authenticated;

create or replace function public.add_company_user(p_tenant_id uuid, p_company_id uuid, p_user_id uuid, p_role_id uuid) returns void
security definer set search_path = public, auth
as $$
begin
  -- Check Company Admin
  if not exists (
    select 1 from public.company_users cu
    join public.company_roles cr on cr.id = cu.role_id
    where cu.company_id = p_company_id 
    and cu.user_id = auth.uid() 
    and cu.tenant_id = p_tenant_id
    and cr.name = 'Admin'
  ) then
    raise exception 'Access Denied: Must be Company Admin';
  end if;
  
  -- Verify User in Tenant
  if not exists (select 1 from public.tenant_users where tenant_id = p_tenant_id and user_id = p_user_id) then
     raise exception 'User not in tenant';
  end if;

  -- Verify Role belongs to Company
  if not exists (select 1 from public.company_roles where id = p_role_id and company_id = p_company_id and tenant_id = p_tenant_id) then
     raise exception 'Role does not belong to company';
  end if;

  insert into public.company_users (company_id, user_id, role_id, tenant_id)
  values (p_company_id, p_user_id, p_role_id, p_tenant_id)
  on conflict do nothing;
end;
$$ language plpgsql;
revoke all on function public.add_company_user(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.add_company_user(uuid, uuid, uuid, uuid) to authenticated;

create or replace function public.remove_company_user(p_tenant_id uuid, p_company_id uuid, p_user_id uuid) returns void
security definer set search_path = public, auth
as $$
begin
  -- Check Company Admin
  if not exists (
    select 1 from public.company_users cu
    join public.company_roles cr on cr.id = cu.role_id
    where cu.company_id = p_company_id 
    and cu.user_id = auth.uid() 
    and cu.tenant_id = p_tenant_id
    and cr.name = 'Admin'
  ) then
    raise exception 'Access Denied: Must be Company Admin';
  end if;

  delete from public.company_users 
  where company_id = p_company_id and user_id = p_user_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.remove_company_user(uuid, uuid, uuid) from public, anon;
grant execute on function public.remove_company_user(uuid, uuid, uuid) to authenticated;

create or replace function public.grant_company_permission(p_tenant_id uuid, p_role_id uuid, p_permission_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_company_id uuid;
begin
  -- Resolve company from role
  select company_id into v_company_id from public.company_roles where id = p_role_id and tenant_id = p_tenant_id;
  
  if v_company_id is null then
     raise exception 'Role not found';
  end if;

  -- Check Company Admin
  if not exists (
    select 1 from public.company_users cu
    join public.company_roles cr on cr.id = cu.role_id
    where cu.company_id = v_company_id 
    and cu.user_id = auth.uid() 
    and cu.tenant_id = p_tenant_id
    and cr.name = 'Admin'
  ) then
    raise exception 'Access Denied: Must be Company Admin';
  end if;
  
  -- Verify permission scope is company (trigger handles this, but good to check early)
  if (select scope from public.permissions where id = p_permission_id) != 'company' then
     raise exception 'Permission scope mismatch';
  end if;

  insert into public.company_role_permissions (role_id, permission_id)
  values (p_role_id, p_permission_id)
  on conflict do nothing;
end;
$$ language plpgsql;
revoke all on function public.grant_company_permission(uuid, uuid, uuid) from public, anon;
grant execute on function public.grant_company_permission(uuid, uuid, uuid) to authenticated;

create or replace function public.revoke_company_permission(p_tenant_id uuid, p_role_id uuid, p_permission_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_company_id uuid;
begin
  -- Resolve company from role
  select company_id into v_company_id from public.company_roles where id = p_role_id and tenant_id = p_tenant_id;
  
  if v_company_id is null then
     raise exception 'Role not found';
  end if;

  -- Check Company Admin
  if not exists (
    select 1 from public.company_users cu
    join public.company_roles cr on cr.id = cu.role_id
    where cu.company_id = v_company_id 
    and cu.user_id = auth.uid() 
    and cu.tenant_id = p_tenant_id
    and cr.name = 'Admin'
  ) then
    raise exception 'Access Denied: Must be Company Admin';
  end if;

  delete from public.company_role_permissions 
  where role_id = p_role_id and permission_id = p_permission_id;
end;
$$ language plpgsql;
revoke all on function public.revoke_company_permission(uuid, uuid, uuid) from public, anon;
grant execute on function public.revoke_company_permission(uuid, uuid, uuid) to authenticated;

commit;
