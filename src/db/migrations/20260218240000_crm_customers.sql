-- 20260218240000_crm_customers.sql
-- Create crm_customers table with strict RLS

create table if not exists public.crm_customers (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    first_name text not null,
    last_name text not null,
    email text not null,
    phone text,
    notes text,
    source text not null default 'manual',
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS
alter table public.crm_customers enable row level security;

create policy "Users can read customers in their tenant"
    on public.crm_customers for select
    using (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = crm_customers.tenant_id
            and tenant_users.user_id = auth.uid()
        )
    );

create policy "Users can insert customers in their tenant"
    on public.crm_customers for insert
    with check (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = crm_customers.tenant_id
            and tenant_users.user_id = auth.uid()
        )
    );

create policy "Users can update customers in their tenant"
    on public.crm_customers for update
    using (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = crm_customers.tenant_id
            and tenant_users.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = crm_customers.tenant_id
            and tenant_users.user_id = auth.uid()
        )
    );

create policy "Users can delete customers in their tenant"
    on public.crm_customers for delete
    using (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = crm_customers.tenant_id
            and tenant_users.user_id = auth.uid()
        )
    );

-- Indexes
create index idx_crm_customers_tenant_id on public.crm_customers(tenant_id);
create index idx_crm_customers_email on public.crm_customers(email);

-- Triggers
create trigger trg_crm_customers_updated_at before update on public.crm_customers
    for each row execute function public.set_updated_at();

-- RPCs for strict mutations (optional but recommended for parity with Partners)
-- We will stick to RLS direct access for standard CRUD as per recent patterns, 
-- unless complex validation is needed. Partners used RPCs, but maybe we can simplify?
-- Actually, strict mode often prefers RPCs for writes. Let's create basic RPCs.

create or replace function public.create_customer(
    p_tenant_id uuid,
    p_first_name text,
    p_last_name text,
    p_email text,
    p_phone text,
    p_notes text,
    p_source text,
    p_is_active boolean
) returns uuid as $$
declare
    v_id uuid;
begin
    -- Security Definer logic usually checks perm here, but RLS + RPC is also valid if RPC is Invoker.
    -- If Security Definer, we must check membership manually.
    -- Strict preference: RPC Security Definer.
    
    -- Check Membership
    if not exists (
        select 1 from public.tenant_users 
        where tenant_id = p_tenant_id and user_id = auth.uid()
    ) then
        raise exception 'Access Denied';
    end if;

    insert into public.crm_customers (tenant_id, first_name, last_name, email, phone, notes, source, is_active)
    values (p_tenant_id, p_first_name, p_last_name, p_email, p_phone, p_notes, p_source, p_is_active)
    returning id into v_id;

    return v_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.update_customer(
    p_tenant_id uuid,
    p_customer_id uuid,
    p_first_name text,
    p_last_name text,
    p_email text,
    p_phone text,
    p_notes text,
    p_source text,
    p_is_active boolean
) returns void as $$
begin
    if not exists (
        select 1 from public.tenant_users 
        where tenant_id = p_tenant_id and user_id = auth.uid()
    ) then
        raise exception 'Access Denied';
    end if;

    update public.crm_customers
    set 
        first_name = coalesce(p_first_name, first_name),
        last_name = coalesce(p_last_name, last_name),
        email = coalesce(p_email, email),
        phone = coalesce(p_phone, phone),
        notes = coalesce(p_notes, notes),
        source = coalesce(p_source, source),
        is_active = coalesce(p_is_active, is_active)
    where id = p_customer_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.delete_customer(
    p_tenant_id uuid,
    p_customer_id uuid
) returns void as $$
begin
    if not exists (
        select 1 from public.tenant_users 
        where tenant_id = p_tenant_id and user_id = auth.uid()
    ) then
        raise exception 'Access Denied';
    end if;

    delete from public.crm_customers
    where id = p_customer_id and tenant_id = p_tenant_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Grant Execute
grant execute on function public.create_customer to authenticated;
grant execute on function public.update_customer to authenticated;
grant execute on function public.delete_customer to authenticated;
