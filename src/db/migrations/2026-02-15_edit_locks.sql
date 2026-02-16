-- Migration: Edit Locks (Strict Tenant Scoping)
-- Date: 2026-02-15

-- 1. Create Table
create table if not exists public.edit_locks (
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    entity_type text not null,
    entity_id uuid not null,
    locked_by uuid not null references auth.users(id) on delete cascade,
    locked_at timestamptz not null default now(),
    expires_at timestamptz not null,
    
    primary key (tenant_id, entity_type, entity_id)
);

-- 2. Indexes
create index if not exists idx_edit_locks_tenant_id on public.edit_locks(tenant_id);
create index if not exists idx_edit_locks_expires_at on public.edit_locks(expires_at);

-- 3. RLS
alter table public.edit_locks enable row level security;
alter table public.edit_locks force row level security;

-- Policy: Select only (Members of tenant)
create policy "Users can view locks in their tenant"
    on public.edit_locks
    for select
    to authenticated
    using (
        exists (
            select 1 from public.tenant_users
            where tenant_users.tenant_id = edit_locks.tenant_id
            and tenant_users.user_id = auth.uid()
        )
    );

-- STRICT: No direct mutation policies for authenticated
-- All mutations must go through RPC

-- 4. Permissions
revoke all on public.edit_locks from public, anon;
grant select on public.edit_locks to authenticated;

-- 5. RPC: acquire_edit_lock
create or replace function public.acquire_edit_lock(
    p_tenant_id uuid,
    p_entity_type text,
    p_entity_id uuid,
    p_override boolean default false,
    p_ttl_seconds int default 600
)
returns table(success boolean, locked_by uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid;
    v_existing_lock record;
    v_new_expiry timestamptz;
begin
    v_user_id := auth.uid();
    
    -- HARDENING: Validate TTL
    if p_ttl_seconds is null or p_ttl_seconds < 30 or p_ttl_seconds > 3600 then
        raise exception 'Invalid ttl_seconds: Must be between 30 and 3600';
    end if;

    -- STIRCT: Verify Tenant Membership
    if not exists (
        select 1 from public.tenant_users
        where tenant_id = p_tenant_id
        and user_id = v_user_id
    ) then
        raise exception 'Access Denied: User not member of tenant';
    end if;

    v_new_expiry := now() + (p_ttl_seconds || ' seconds')::interval;

    -- Lock the row if exists (Atomic Upsert simulation)
    insert into public.edit_locks (tenant_id, entity_type, entity_id, locked_by, expires_at)
    values (p_tenant_id, p_entity_type, p_entity_id, v_user_id, v_new_expiry)
    on conflict (tenant_id, entity_type, entity_id)
    do update
    set 
        locked_by = 
            case 
                -- Case B: Expired -> Take it
                when edit_locks.expires_at < now() then v_user_id
                -- Case C: Internal Refresh -> Keep it (Refreshed below)
                when edit_locks.locked_by = v_user_id then v_user_id
                -- Case D: Override -> Take it
                when p_override = true then v_user_id
                -- Else -> Keep existing
                else edit_locks.locked_by
            end,
        expires_at = 
            case
                -- Update expiry if taking lock (B, C, D)
                when edit_locks.expires_at < now() 
                     or edit_locks.locked_by = v_user_id 
                     or p_override = true 
                then v_new_expiry
                else edit_locks.expires_at
            end,
        locked_at = 
            case
                -- Update locked_at ONLY if ownership changes or strict refresh?
                -- Request says: Update locked_at on expired takeover, same user refresh, override takeover.
                -- Basically any time we update expires_at, we treat it as a new/refreshed lock.
                when edit_locks.expires_at < now() 
                     or edit_locks.locked_by = v_user_id 
                     or p_override = true 
                then now()
                else edit_locks.locked_at
            end
    returning locked_by, expires_at into v_existing_lock;

    -- Determine Success
    if v_existing_lock.locked_by = v_user_id then
        return query select true, v_existing_lock.locked_by, v_existing_lock.expires_at;
    else
        return query select false, v_existing_lock.locked_by, v_existing_lock.expires_at;
    end if;
end;
$$;

-- 6. RPC: release_edit_lock
create or replace function public.release_edit_lock(
    p_tenant_id uuid,
    p_entity_type text,
    p_entity_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid;
begin
    v_user_id := auth.uid();

    delete from public.edit_locks
    where tenant_id = p_tenant_id
    and entity_type = p_entity_type
    and entity_id = p_entity_id
    and locked_by = v_user_id;
    
    return found;
end;
$$;

-- 7. RPC Permissions
revoke all on function public.acquire_edit_lock from public, anon;
grant execute on function public.acquire_edit_lock to authenticated;

revoke all on function public.release_edit_lock from public, anon;
grant execute on function public.release_edit_lock to authenticated;
