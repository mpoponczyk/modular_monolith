-- Business Hierarchy v2 Schema (Paranoid Strict)
-- Includes: Groups, Organizations, Companies, Projects, Service Offerings
-- Features: Composite Keys, Structural Tenant Isolation, Separate Company RBAC, RLS, Revoked Writes

begin;

-- 1. Permissions Extension
alter table public.permissions 
add column scope text not null default 'tenant' check (scope in ('tenant', 'company'));

create index idx_permissions_scope on public.permissions(scope);

-- 2. Groups (Tenant-Scoped)
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, name),
  unique(id, tenant_id) -- Required for Composite FK
);
alter table public.groups enable row level security;
alter table public.groups force row level security;

create table public.group_members (
  group_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  tenant_id uuid,
  created_at timestamptz default now(),
  primary key (group_id, user_id),
  foreign key (group_id, tenant_id) references public.groups(id, tenant_id) on delete cascade
);
alter table public.group_members enable row level security;
alter table public.group_members force row level security;

-- 3. Core Hierarchy Tables (Strict + RLS)

-- 3.1 Organizations
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  owner_group_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, name),
  unique(id, tenant_id), -- Required for Composite FK
  foreign key (owner_group_id, tenant_id) references public.groups(id, tenant_id) -- Strict Tenant Match
);
alter table public.organizations enable row level security;
alter table public.organizations force row level security;

-- 3.2 Companies
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, name),
  unique(id, tenant_id) -- Required for Composite FK
);
alter table public.companies enable row level security;
alter table public.companies force row level security;

-- Link: Organization <-> Company
create table public.org_companies (
  organization_id uuid,
  company_id uuid,
  tenant_id uuid not null,
  primary key (organization_id, company_id),
  foreign key (organization_id, tenant_id) references public.organizations(id, tenant_id) on delete cascade,
  foreign key (company_id, tenant_id) references public.companies(id, tenant_id) on delete cascade
);
alter table public.org_companies enable row level security;
alter table public.org_companies force row level security;

-- 3.3 Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null,
  organization_id uuid not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, organization_id, name),
  unique(id, tenant_id), -- Required for Composite FK
  foreign key (organization_id, tenant_id) references public.organizations(id, tenant_id) on delete restrict,
  foreign key (tenant_id) references public.tenants(id) on delete cascade
);
alter table public.projects enable row level security;
alter table public.projects force row level security;

-- Link: Project <-> Company (Invariant Enforced)
create table public.project_companies (
  project_id uuid,
  company_id uuid,
  tenant_id uuid not null,
  primary key (project_id, company_id),
  unique(project_id, company_id, tenant_id), -- For composite reference
  foreign key (project_id, tenant_id) references public.projects(id, tenant_id) on delete cascade,
  foreign key (company_id, tenant_id) references public.companies(id, tenant_id) on delete cascade
);
alter table public.project_companies enable row level security;
alter table public.project_companies force row level security;

-- Trigger: Enforce Org Membership for Project Companies (SECURITY DEFINER)
create or replace function public.enforce_project_company_org_match() returns trigger 
security definer
set search_path = public, auth
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id from public.projects where id = NEW.project_id;
  if not exists (
      select 1 from public.org_companies 
      where organization_id = v_org_id 
      and company_id = NEW.company_id
      and tenant_id = NEW.tenant_id -- Strict Tenant Check
  ) then
    raise exception 'Company must belong to the Project Organization';
  end if;
  return NEW;
end;
$$ language plpgsql;
revoke all on function public.enforce_project_company_org_match() from public, anon;
-- No grant to authenticated needed strictly for triggers

create trigger trg_project_companies_org_check
before insert on public.project_companies
for each row execute function public.enforce_project_company_org_match();

-- 3.4 Service Offerings
create table public.service_offerings (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null,
  project_id uuid not null,
  name text not null,
  owner_group_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, project_id, name),
  unique(id, tenant_id), -- Required for Composite FK
  foreign key (project_id, tenant_id) references public.projects(id, tenant_id) on delete restrict,
  foreign key (owner_group_id, tenant_id) references public.groups(id, tenant_id), -- Strict Tenant Match
  foreign key (tenant_id) references public.tenants(id) on delete cascade
);
alter table public.service_offerings enable row level security;
alter table public.service_offerings force row level security;

-- Link: Service Offering <-> Companies (Composition)
create table public.service_offering_companies (
  service_offering_id uuid,
  company_id uuid,
  tenant_id uuid not null,
  primary key (service_offering_id, company_id),
  foreign key (service_offering_id, tenant_id) references public.service_offerings(id, tenant_id) on delete cascade,
  foreign key (company_id, tenant_id) references public.companies(id, tenant_id) on delete cascade
);
alter table public.service_offering_companies enable row level security;
alter table public.service_offering_companies force row level security;

-- Trigger: Enforce Project Membership for Service Offering Companies (SECURITY DEFINER)
create or replace function public.enforce_offering_company_project_match() returns trigger 
security definer
set search_path = public, auth
as $$
declare
  v_project_id uuid;
begin
  select project_id into v_project_id from public.service_offerings where id = NEW.service_offering_id;
  -- Company must be in project_companies for this project
  if not exists (
      select 1 from public.project_companies 
      where project_id = v_project_id 
      and company_id = NEW.company_id
      and tenant_id = NEW.tenant_id -- Strict Tenant Check
  ) then
     raise exception 'Company must belong to the Project to participate in Service Offering';
  end if;
  return NEW;
end;
$$ language plpgsql;
revoke all on function public.enforce_offering_company_project_match() from public, anon;

create trigger trg_offering_company_project_check
before insert on public.service_offering_companies
for each row execute function public.enforce_offering_company_project_match();

-- 4. Company RBAC Tables

-- 4.1 Company Roles
create table public.company_roles (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  company_id uuid not null,
  name text not null,
  created_at timestamptz default now(),
  unique(company_id, name),
  unique(id, tenant_id), -- For Composite FK
  foreign key (company_id, tenant_id) references public.companies(id, tenant_id) on delete cascade
);
alter table public.company_roles enable row level security;
alter table public.company_roles force row level security;

-- 4.2 Company Users
create table public.company_users (
  company_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  role_id uuid not null,
  tenant_id uuid not null,
  primary key (company_id, user_id),
  foreign key (company_id, tenant_id) references public.companies(id, tenant_id) on delete cascade,
  foreign key (role_id, tenant_id) references public.company_roles(id, tenant_id) -- Strict Role Scope Match
);
alter table public.company_users enable row level security;
alter table public.company_users force row level security;

-- 4.3 Company Role Permissions
create table public.company_role_permissions (
  role_id uuid references public.company_roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);
alter table public.company_role_permissions enable row level security;
alter table public.company_role_permissions force row level security;

-- Trigger: Ensure permission has scope='company' (SECURITY DEFINER)
create or replace function public.enforce_company_perm_scope() returns trigger 
security definer
set search_path = public, auth
as $$
begin
  if (select scope from public.permissions where id = NEW.permission_id) != 'company' then
    raise exception 'Company roles can only have company-scoped permissions';
  end if;
  return NEW;
end;
$$ language plpgsql;
revoke all on function public.enforce_company_perm_scope() from public, anon;

create trigger trg_company_role_perm_scope
before insert on public.company_role_permissions
for each row execute function public.enforce_company_perm_scope();

-- 5. RLS Policies (Consolidated) – SELECT ONLY

-- 5.1 Groups
create policy "groups_select" on public.groups for select to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
    and gm.user_id = auth.uid()
    and gm.tenant_id = groups.tenant_id -- Tenant Match
  )
);
revoke insert, update, delete on public.groups from authenticated;

-- 5.2 Group Members
create policy "group_members_select" on public.group_members for select to authenticated
using (
  (user_id = auth.uid()) 
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
    and gm.user_id = auth.uid()
    and gm.tenant_id = group_members.tenant_id -- Tenant Match
  )
);
revoke insert, update, delete on public.group_members from authenticated;

-- 5.3 Organizations
create policy "org_select" on public.organizations for select to authenticated
using ( 
  -- Path 1: Owner Group Member
  exists (
    select 1 from public.group_members gm
    where gm.group_id = organizations.owner_group_id
    and gm.user_id = auth.uid()
    and gm.tenant_id = organizations.tenant_id -- Tenant Match
  )
  -- Path 2: Member of Linked Company
  or exists (
    select 1 from public.org_companies oc
    join public.company_users cu on cu.company_id = oc.company_id
    where oc.organization_id = organizations.id
    and cu.user_id = auth.uid()
    and oc.tenant_id = organizations.tenant_id -- Tenant Match
    and cu.tenant_id = organizations.tenant_id -- Tenant Match
  )
);
revoke insert, update, delete on public.organizations from authenticated;

-- 5.4 Companies
create policy "company_select" on public.companies for select to authenticated
using (
  -- Path 1: Direct Member
  exists (
    select 1 from public.company_users cu
    where cu.company_id = companies.id 
    and cu.user_id = auth.uid()
    and cu.tenant_id = companies.tenant_id -- Tenant Match
  )
  -- Path 2: Parent Org Owner
  or exists (
    select 1 from public.org_companies oc
    join public.organizations o on o.id = oc.organization_id
    join public.group_members gm on gm.group_id = o.owner_group_id
    where oc.company_id = companies.id
    and gm.user_id = auth.uid()
    and oc.tenant_id = companies.tenant_id     -- Tenant Match
    and o.tenant_id = companies.tenant_id      -- Tenant Match
    and gm.tenant_id = companies.tenant_id     -- Tenant Match
  )
);
revoke insert, update, delete on public.companies from authenticated;

-- 5.5 Projects
create policy "project_select" on public.projects for select to authenticated
using (
   -- Path 1: Direct Company Member on Project
   exists (
     select 1 from public.project_companies pc
     join public.company_users cu on cu.company_id = pc.company_id
     where pc.project_id = projects.id
     and cu.user_id = auth.uid()
     and pc.tenant_id = projects.tenant_id
     and cu.tenant_id = projects.tenant_id
   )
   -- Path 2: Org Owner
   or exists (
     select 1 from public.organizations o
     join public.group_members gm on gm.group_id = o.owner_group_id
     where o.id = projects.organization_id
     and gm.user_id = auth.uid()
     and o.tenant_id = projects.tenant_id
     and gm.tenant_id = projects.tenant_id
   )
);
revoke insert, update, delete on public.projects from authenticated;

-- 5.6 Service Offerings
create policy "service_offering_select" on public.service_offerings for select to authenticated
using (
     -- Path 1: Owner Group Member
    exists (
      select 1 from public.group_members gm
      where gm.group_id = service_offerings.owner_group_id
      and gm.user_id = auth.uid()
      and gm.tenant_id = service_offerings.tenant_id
    )
    -- Path 2: Project Member via Company (Implicitly visible if Project is visible? No, let's keep it strict.)
    -- Actually, strict requirement said: "Visible if Project visible OR Owner Group member"
    -- Project Visibility is complex, so let's reproduce it or join to project?
    -- Constraint: "Visible if Project visible" 
    or exists (
       select 1 from public.projects p
       -- Cross join to project policies logic essentially
       -- Re-implementing logic for simplicity and strictness:
       where p.id = service_offerings.project_id
       and p.tenant_id = service_offerings.tenant_id
       and (
          -- Project Logic: Company Member
          exists (
             select 1 from public.project_companies pc
             join public.company_users cu on cu.company_id = pc.company_id
             where pc.project_id = p.id
             and cu.user_id = auth.uid()
             and pc.tenant_id = p.tenant_id
             and cu.tenant_id = p.tenant_id
          )
          -- Project Logic: Org Owner
          or exists (
             select 1 from public.organizations o
             join public.group_members gm on gm.group_id = o.owner_group_id
             where o.id = p.organization_id
             and gm.user_id = auth.uid()
             and o.tenant_id = p.tenant_id
             and gm.tenant_id = p.tenant_id
          )
       )
    )
);
revoke insert, update, delete on public.service_offerings from authenticated;

-- 5.7 Link Tables (Revoke All Writes)
revoke insert, update, delete on public.org_companies from authenticated;
revoke insert, update, delete on public.project_companies from authenticated;
revoke insert, update, delete on public.service_offering_companies from authenticated;

-- 5.8 Company RBAC (Revoke All Writes)
revoke insert, update, delete on public.company_roles from authenticated;
revoke insert, update, delete on public.company_users from authenticated;
revoke insert, update, delete on public.company_role_permissions from authenticated;

-- RLS for Company RBAC
create policy "company_users_select" on public.company_users for select to authenticated
using (
  (user_id = auth.uid())
  or exists (
    -- Visible to members of the same company
    select 1 from public.company_users cu
    where cu.company_id = company_users.company_id
    and cu.user_id = auth.uid()
    and cu.tenant_id = company_users.tenant_id
  )
);

create policy "company_roles_select" on public.company_roles for select to authenticated
using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = company_roles.company_id
    and cu.user_id = auth.uid()
    and cu.tenant_id = company_roles.tenant_id
  )
);

create policy "company_role_perms_select" on public.company_role_permissions for select to authenticated
using (
  exists (
    select 1 from public.company_roles cr
    join public.company_users cu on cu.company_id = cr.company_id
    where cr.id = company_role_permissions.role_id
    and cu.user_id = auth.uid()
    and cu.tenant_id = cr.tenant_id -- Implicit tenant join via roles
  )
);

commit;
