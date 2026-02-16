-- Business Hierarchy v2 RPC Suite (Paranoid Strict)
-- Implements: RPC-Only Write Model
-- Context: SECURITY DEFINER, search_path = public, auth

begin;

-- Helper: Verify Tenant Membership
create or replace function public.verify_tenant_membership(p_tenant_id uuid) returns void
security definer set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.tenant_users 
    where tenant_id = p_tenant_id 
    and user_id = auth.uid()
  ) then
    raise exception 'Access Denied: User is not a member of this tenant';
  end if;
end;
$$ language plpgsql;
revoke all on function public.verify_tenant_membership(uuid) from public, anon;
grant execute on function public.verify_tenant_membership(uuid) to authenticated;

-- ==============================================================================
-- 1. Groups RPCs
-- ==============================================================================

create or replace function public.create_group(p_tenant_id uuid, p_name text) returns uuid
security definer set search_path = public, auth
as $$
declare
  v_group_id uuid;
begin
  perform public.verify_tenant_membership(p_tenant_id);
  
  insert into public.groups (tenant_id, name)
  values (p_tenant_id, p_name)
  returning id into v_group_id;
  
  -- Auto-add creator as member
  insert into public.group_members (group_id, user_id, tenant_id)
  values (v_group_id, auth.uid(), p_tenant_id);
  
  return v_group_id;
end;
$$ language plpgsql;
revoke all on function public.create_group(uuid, text) from public, anon;
grant execute on function public.create_group(uuid, text) to authenticated;

create or replace function public.rename_group(p_tenant_id uuid, p_group_id uuid, p_name text) returns void
security definer set search_path = public, auth
as $$
begin
  -- Check membership
  if not exists (
    select 1 from public.group_members 
    where group_id = p_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be a group member to rename';
  end if;

  update public.groups set name = p_name, updated_at = now()
  where id = p_group_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.rename_group(uuid, uuid, text) from public, anon;
grant execute on function public.rename_group(uuid, uuid, text) to authenticated;

create or replace function public.delete_group(p_tenant_id uuid, p_group_id uuid) returns void
security definer set search_path = public, auth
as $$
begin
  -- Check membership (Strictly, maybe need admin? For now, member is owner-ish)
  if not exists (
    select 1 from public.group_members 
    where group_id = p_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be a group member to delete';
  end if;

  delete from public.groups where id = p_group_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.delete_group(uuid, uuid) from public, anon;
grant execute on function public.delete_group(uuid, uuid) to authenticated;

create or replace function public.add_group_member(p_tenant_id uuid, p_group_id uuid, p_user_id uuid) returns void
security definer set search_path = public, auth
as $$
begin
  -- Check invoker membership
  if not exists (
    select 1 from public.group_members 
    where group_id = p_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be a group member to add others';
  end if;
  
  -- Ensure target user is in tenant
  if not exists (
    select 1 from public.tenant_users
    where tenant_id = p_tenant_id and user_id = p_user_id
  ) then
    raise exception 'Target user not in tenant';
  end if;

  insert into public.group_members (group_id, user_id, tenant_id)
  values (p_group_id, p_user_id, p_tenant_id)
  on conflict do nothing;
end;
$$ language plpgsql;
revoke all on function public.add_group_member(uuid, uuid, uuid) from public, anon;
grant execute on function public.add_group_member(uuid, uuid, uuid) to authenticated;

create or replace function public.remove_group_member(p_tenant_id uuid, p_group_id uuid, p_user_id uuid) returns void
security definer set search_path = public, auth
as $$
begin
  -- Check invoker membership
  if not exists (
    select 1 from public.group_members 
    where group_id = p_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be a group member to remove others';
  end if;

  delete from public.group_members 
  where group_id = p_group_id and user_id = p_user_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.remove_group_member(uuid, uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid, uuid) to authenticated;


-- ==============================================================================
-- 2. Organizations RPCs
-- ==============================================================================

create or replace function public.create_organization(p_tenant_id uuid, p_name text, p_owner_group_id uuid) returns uuid
security definer set search_path = public, auth
as $$
declare
  v_org_id uuid;
begin
  perform public.verify_tenant_membership(p_tenant_id);
  
  -- Must be member of owner group
  if not exists (
    select 1 from public.group_members 
    where group_id = p_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;

  insert into public.organizations (tenant_id, name, owner_group_id)
  values (p_tenant_id, p_name, p_owner_group_id)
  returning id into v_org_id;
  
  return v_org_id;
end;
$$ language plpgsql;
revoke all on function public.create_organization(uuid, text, uuid) from public, anon;
grant execute on function public.create_organization(uuid, text, uuid) to authenticated;

create or replace function public.update_organization(p_tenant_id uuid, p_org_id uuid, p_name text, p_owner_group_id uuid default null) returns void
security definer set search_path = public, auth
as $$
declare
  v_current_owner_group_id uuid;
begin
  select owner_group_id into v_current_owner_group_id from public.organizations where id = p_org_id and tenant_id = p_tenant_id;
  
  -- Must be member of current owner group
  if not exists (
    select 1 from public.group_members 
    where group_id = v_current_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;

  if p_owner_group_id is not null then
     -- Validate new group is in tenant
    if not exists (select 1 from public.groups where id = p_owner_group_id and tenant_id = p_tenant_id) then
        raise exception 'New owner group invalid';
    end if;
  end if;

  update public.organizations 
  set name = coalesce(p_name, name),
      owner_group_id = coalesce(p_owner_group_id, owner_group_id),
      updated_at = now()
  where id = p_org_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.update_organization(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.update_organization(uuid, uuid, text, uuid) to authenticated;

create or replace function public.delete_organization(p_tenant_id uuid, p_org_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_owner_group_id uuid;
begin
  select owner_group_id into v_owner_group_id from public.organizations where id = p_org_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;

  delete from public.organizations where id = p_org_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.delete_organization(uuid, uuid) from public, anon;
grant execute on function public.delete_organization(uuid, uuid) to authenticated;

create or replace function public.link_company_to_org(p_tenant_id uuid, p_org_id uuid, p_company_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_owner_group_id uuid;
begin
  select owner_group_id into v_owner_group_id from public.organizations where id = p_org_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;
  
  -- Company must be in same tenant
  if not exists (select 1 from public.companies where id = p_company_id and tenant_id = p_tenant_id) then
    raise exception 'Company not found in tenant';
  end if;

  insert into public.org_companies (organization_id, company_id, tenant_id)
  values (p_org_id, p_company_id, p_tenant_id)
  on conflict do nothing;
end;
$$ language plpgsql;
revoke all on function public.link_company_to_org(uuid, uuid, uuid) from public, anon;
grant execute on function public.link_company_to_org(uuid, uuid, uuid) to authenticated;


create or replace function public.unlink_company_from_org(p_tenant_id uuid, p_org_id uuid, p_company_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_owner_group_id uuid;
begin
  select owner_group_id into v_owner_group_id from public.organizations where id = p_org_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;

  delete from public.org_companies 
  where organization_id = p_org_id and company_id = p_company_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.unlink_company_from_org(uuid, uuid, uuid) from public, anon;
grant execute on function public.unlink_company_from_org(uuid, uuid, uuid) to authenticated;

-- ==============================================================================
-- 3. Companies RPCs
-- ==============================================================================

create or replace function public.create_company(p_tenant_id uuid, p_name text) returns uuid
security definer set search_path = public, auth
as $$
declare
  v_company_id uuid;
begin
  perform public.verify_tenant_membership(p_tenant_id);
  
  insert into public.companies (tenant_id, name)
  values (p_tenant_id, p_name)
  returning id into v_company_id;
  
  -- Auto-add creator as Admin? Requires Role. 
  -- For now, we just create the company. Caller must add themselves via add_company_member (which requires admin... bootstrap problem?)
  -- Bootstrap: Add creator as 'admin' role.
  
  -- 1. Create 'Admin' Role for this company
  insert into public.company_roles (tenant_id, company_id, name)
  values (p_tenant_id, v_company_id, 'Admin');
  
  -- 2. Add User
  insert into public.company_users (company_id, user_id, role_id, tenant_id)
  select v_company_id, auth.uid(), id, p_tenant_id
  from public.company_roles 
  where company_id = v_company_id and name = 'Admin';

  return v_company_id;
end;
$$ language plpgsql;
revoke all on function public.create_company(uuid, text) from public, anon;
grant execute on function public.create_company(uuid, text) to authenticated;

create or replace function public.update_company(p_tenant_id uuid, p_company_id uuid, p_name text) returns void
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
    and cr.name = 'Admin' -- Hardcoded check for now, ideally explicit permission
  ) then
    raise exception 'Access Denied: Must be Company Admin';
  end if;

  update public.companies set name = p_name, updated_at = now()
  where id = p_company_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.update_company(uuid, uuid, text) from public, anon;
grant execute on function public.update_company(uuid, uuid, text) to authenticated;

create or replace function public.delete_company(p_tenant_id uuid, p_company_id uuid) returns void
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

  delete from public.companies where id = p_company_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.delete_company(uuid, uuid) from public, anon;
grant execute on function public.delete_company(uuid, uuid) to authenticated;


-- ==============================================================================
-- 4. Projects RPCs
-- ==============================================================================

create or replace function public.create_project(p_tenant_id uuid, p_organization_id uuid, p_name text) returns uuid
security definer set search_path = public, auth
as $$
declare
  v_project_id uuid;
  v_org_owner_group uuid;
begin
  -- Check Org Ownership
  select owner_group_id into v_org_owner_group from public.organizations where id = p_organization_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_org_owner_group and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be Org Owner to create Project';
  end if;

  insert into public.projects (tenant_id, organization_id, name)
  values (p_tenant_id, p_organization_id, p_name)
  returning id into v_project_id;
  
  return v_project_id;
end;
$$ language plpgsql;
revoke all on function public.create_project(uuid, uuid, text) from public, anon;
grant execute on function public.create_project(uuid, uuid, text) to authenticated;

create or replace function public.link_company_to_project(p_tenant_id uuid, p_project_id uuid, p_company_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
    v_org_owner_group uuid;
    v_org_id uuid;
begin
  select organization_id into v_org_id from public.projects where id = p_project_id and tenant_id = p_tenant_id;
  select owner_group_id into v_org_owner_group from public.organizations where id = v_org_id and tenant_id = p_tenant_id;

   if not exists (
    select 1 from public.group_members 
    where group_id = v_org_owner_group and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be Org Owner to manage Project Links';
  end if;

  insert into public.project_companies (project_id, company_id, tenant_id)
  values (p_project_id, p_company_id, p_tenant_id)
  on conflict do nothing;
end;
$$ language plpgsql;
revoke all on function public.link_company_to_project(uuid, uuid, uuid) from public, anon;
grant execute on function public.link_company_to_project(uuid, uuid, uuid) to authenticated;

-- ==============================================================================
-- 5. Service Offerings RPCs (Abbreviated, following pattern)
-- ==============================================================================

create or replace function public.create_service_offering(p_tenant_id uuid, p_project_id uuid, p_name text, p_owner_group_id uuid) returns uuid
security definer set search_path = public, auth
as $$
declare
  v_id uuid;
begin
  perform public.verify_tenant_membership(p_tenant_id);
  -- Check Member of owner group
   if not exists (
    select 1 from public.group_members 
    where group_id = p_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;

  insert into public.service_offerings (tenant_id, project_id, name, owner_group_id)
  values (p_tenant_id, p_project_id, p_name, p_owner_group_id)
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql;
revoke all on function public.create_service_offering(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.create_service_offering(uuid, uuid, text, uuid) to authenticated;


create or replace function public.update_project(p_tenant_id uuid, p_project_id uuid, p_name text) returns void
security definer set search_path = public, auth
as $$
declare
  v_org_id uuid;
  v_org_owner_group uuid;
begin
  select organization_id into v_org_id from public.projects where id = p_project_id and tenant_id = p_tenant_id;
  select owner_group_id into v_org_owner_group from public.organizations where id = v_org_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_org_owner_group and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be Org Owner to update Project';
  end if;

  update public.projects set name = p_name, updated_at = now()
  where id = p_project_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.update_project(uuid, uuid, text) from public, anon;
grant execute on function public.update_project(uuid, uuid, text) to authenticated;

create or replace function public.delete_project(p_tenant_id uuid, p_project_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_org_id uuid;
  v_org_owner_group uuid;
begin
  select organization_id into v_org_id from public.projects where id = p_project_id and tenant_id = p_tenant_id;
  select owner_group_id into v_org_owner_group from public.organizations where id = v_org_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_org_owner_group and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be Org Owner to delete Project';
  end if;

  delete from public.projects where id = p_project_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.delete_project(uuid, uuid) from public, anon;
grant execute on function public.delete_project(uuid, uuid) to authenticated;

create or replace function public.unlink_company_from_project(p_tenant_id uuid, p_project_id uuid, p_company_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_org_id uuid;
  v_org_owner_group uuid;
begin
  select organization_id into v_org_id from public.projects where id = p_project_id and tenant_id = p_tenant_id;
  select owner_group_id into v_org_owner_group from public.organizations where id = v_org_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_org_owner_group and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be Org Owner to unlink company';
  end if;

  delete from public.project_companies 
  where project_id = p_project_id and company_id = p_company_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.unlink_company_from_project(uuid, uuid, uuid) from public, anon;
grant execute on function public.unlink_company_from_project(uuid, uuid, uuid) to authenticated;

create or replace function public.update_service_offering(p_tenant_id uuid, p_offering_id uuid, p_name text, p_owner_group_id uuid default null) returns void
security definer set search_path = public, auth
as $$
declare
  v_current_owner_group_id uuid;
begin
  select owner_group_id into v_current_owner_group_id from public.service_offerings where id = p_offering_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_current_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;
  
  if p_owner_group_id is not null then
      if not exists (select 1 from public.groups where id = p_owner_group_id and tenant_id = p_tenant_id) then
        raise exception 'New owner group invalid';
      end if;
  end if;

  update public.service_offerings 
  set name = coalesce(p_name, name),
      owner_group_id = coalesce(p_owner_group_id, owner_group_id),
      updated_at = now()
  where id = p_offering_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.update_service_offering(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.update_service_offering(uuid, uuid, text, uuid) to authenticated;

create or replace function public.delete_service_offering(p_tenant_id uuid, p_offering_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_owner_group_id uuid;
begin
  select owner_group_id into v_owner_group_id from public.service_offerings where id = p_offering_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;

  delete from public.service_offerings where id = p_offering_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.delete_service_offering(uuid, uuid) from public, anon;
grant execute on function public.delete_service_offering(uuid, uuid) to authenticated;

create or replace function public.link_company_to_service_offering(p_tenant_id uuid, p_offering_id uuid, p_company_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_owner_group_id uuid;
begin
  select owner_group_id into v_owner_group_id from public.service_offerings where id = p_offering_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;
  
  -- Company must be in tenant (and project, enforced by trigger)
  insert into public.service_offering_companies (service_offering_id, company_id, tenant_id)
  values (p_offering_id, p_company_id, p_tenant_id)
  on conflict do nothing;
end;
$$ language plpgsql;
revoke all on function public.link_company_to_service_offering(uuid, uuid, uuid) from public, anon;
grant execute on function public.link_company_to_service_offering(uuid, uuid, uuid) to authenticated;

create or replace function public.unlink_company_from_service_offering(p_tenant_id uuid, p_offering_id uuid, p_company_id uuid) returns void
security definer set search_path = public, auth
as $$
declare
  v_owner_group_id uuid;
begin
  select owner_group_id into v_owner_group_id from public.service_offerings where id = p_offering_id and tenant_id = p_tenant_id;
  
  if not exists (
    select 1 from public.group_members 
    where group_id = v_owner_group_id and user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'Access Denied: Must be member of owner group';
  end if;

  delete from public.service_offering_companies 
  where service_offering_id = p_offering_id and company_id = p_company_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql;
revoke all on function public.unlink_company_from_service_offering(uuid, uuid, uuid) from public, anon;
grant execute on function public.unlink_company_from_service_offering(uuid, uuid, uuid) to authenticated;

commit;
