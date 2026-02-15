-- Protocol: STRICT_RBAC_RLS_V2
-- Database Schema for Modular Monolith (Production Grade)

-- 1. Enable pgcrypto
create extension if not exists "pgcrypto";

-- 2. Tenants Table
create table public.tenants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    status text not null default 'active',
    config jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. Profiles Table (Linked to auth.users)
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. Roles Table (Tenant-Scoped)
create table public.roles (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(tenant_id, name)
);

-- 5. Permissions Table (Global)
create table public.permissions (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    description text
);

-- 6. Role Permissions (Join Table)
create table public.role_permissions (
    role_id uuid references public.roles(id) on delete cascade,
    permission_id uuid references public.permissions(id) on delete cascade,
    primary key (role_id, permission_id)
);

-- 7. Tenant Users (Join Table: Tenant + User + Role)
create table public.tenant_users (
    tenant_id uuid references public.tenants(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role_id uuid references public.roles(id) on delete cascade,
    primary key (tenant_id, user_id, role_id)
);

-- 8. Tenant Modules (Activation)
create table public.tenant_modules (
    tenant_id uuid references public.tenants(id) on delete cascade,
    module_id text not null,
    primary key (tenant_id, module_id)
);

-- 9. Enable Row Level Security (RLS)
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.tenant_users enable row level security;
alter table public.tenant_modules enable row level security;

-- 10. Triggers & Functions (Automation & consistency)

-- A) Updated At Maintenance
create or replace function public.set_updated_at()
returns trigger as $$
begin
    NEW.updated_at = now();
    return NEW;
end;
$$ language plpgsql;

create trigger trg_tenants_updated_at before update on public.tenants
    for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();

create trigger trg_roles_updated_at before update on public.roles
    for each row execute function public.set_updated_at();

-- B) Tenant Consistency (Role must belong to Tenant)
create or replace function public.enforce_tenant_user_role_consistency()
returns trigger as $$
declare
    role_tenant_id uuid;
begin
    -- 1. Get the tenant_id of the referenced role
    select tenant_id into role_tenant_id 
    from public.roles 
    where id = NEW.role_id;

    -- 2. Check if role exists
    if role_tenant_id is null then
        raise exception 'Role does not exist';
    end if;

    -- 3. Check consistency
    if role_tenant_id <> NEW.tenant_id then
        raise exception 'Role belongs to a different tenant';
    end if;

    return NEW;
end;
$$ language plpgsql;

-- Documentation: RBAC Management
-- RBAC tables (roles, permissions, role_permissions, tenant_users) and tenant_modules 
-- are managed ONLY by server-admin (service role) / migrations.
-- Authenticated clients have SELECT-only grants and no write policies by design.

create trigger trg_enforce_tenant_user_role_consistency
    before insert or update on public.tenant_users
    for each row
    execute function public.enforce_tenant_user_role_consistency();

-- 11. Hardening Permissions (Least Privilege)
-- Remove default public access
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from public;

-- Explicit Grants (Tightened)
grant select, insert, update on public.profiles to authenticated;
grant select on public.tenants to authenticated;
grant select on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant select on public.tenant_users to authenticated;
grant select on public.tenant_modules to authenticated;

-- 12. RLS Policies

-- A) PROFILES
create policy "Users can read own profile"
    on public.profiles for select
    using ( auth.uid() = id );

create policy "Users can insert own profile"
    on public.profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile"
    on public.profiles for update
    using ( auth.uid() = id )
    with check ( auth.uid() = id );

-- B) TENANTS
-- Strict: Only visible if you are a member
create policy "Users can read tenants they belong to"
    on public.tenants for select
    using (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = tenants.id
            and tenant_users.user_id = auth.uid()
        )
    );

-- C) TENANT USERS
-- Use strict lookup to prevent leakage
create policy "Users can read members of their tenants"
    on public.tenant_users for select
    using (
        exists (
            select 1 from public.tenant_users as my_membership
            where my_membership.tenant_id = tenant_users.tenant_id
            and my_membership.user_id = auth.uid()
        )
    );

-- D) OTHER TABLES

-- Roles
create policy "Users can read roles in their tenants"
    on public.roles for select
    using (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = roles.tenant_id
            and tenant_users.user_id = auth.uid()
        )
    );

-- Permissions (Internal/Global - Read Only)
create policy "Authenticated users can read permissions"
    on public.permissions for select
    to authenticated
    using ( true );

-- Role Permissions
create policy "Users can read role permissions in their tenants"
    on public.role_permissions for select
    using (
        exists (
            select 1 from public.roles
            join public.tenant_users on tenant_users.tenant_id = roles.tenant_id
            where roles.id = role_permissions.role_id
            and tenant_users.user_id = auth.uid()
        )
    );

-- Tenant Modules
create policy "Users can read modules of their tenants"
    on public.tenant_modules for select
    using (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = tenant_modules.tenant_id
            and tenant_users.user_id = auth.uid()
        )
    );

-- 13. Indexes (Optimized)
create index idx_roles_tenant_id on public.roles(tenant_id);
create index idx_role_permissions_role_id on public.role_permissions(role_id);
create index idx_role_permissions_permission_id on public.role_permissions(permission_id);
create index idx_tenant_users_user_id on public.tenant_users(user_id);
create index idx_tenant_users_tenant_id on public.tenant_users(tenant_id);
create index idx_tenant_modules_tenant_id on public.tenant_modules(tenant_id);
