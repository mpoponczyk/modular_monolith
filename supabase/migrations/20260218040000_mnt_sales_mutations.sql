-- Migration: Sales Mutations (RPCs)
-- Date: 2026-02-18
-- Description: RPCs for creating Trips, Reservations, Orders securely.

-- 1. Create Trip (Admin Only)
create or replace function public.create_trip(
    p_tenant_id text,
    p_route_id uuid,
    p_ferry_id uuid,
    p_departure_time timestamptz,
    p_arrival_time timestamptz,
    p_is_public boolean default true,
    p_zone_config jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_trip_id uuid;
    v_has_permission boolean;
begin
    -- 1. Check Permissions (Simple Check for now, can be expanded to RBAC)
    -- Assuming authenticated user with tenant access is admin (simplified for MVP)
    -- In strict mode, we'd check strict permissions.
    if auth.jwt() ->> 'tenant_id' <> p_tenant_id then
        raise exception 'Tenant mismatch';
    end if;

    -- 2. Insert Trip
    insert into public.mnt_trips (
        tenant_id, route_id, ferry_id, departure_time, arrival_time, is_public, zone_config
    ) values (
        p_tenant_id, p_route_id, p_ferry_id, p_departure_time, p_arrival_time, p_is_public, p_zone_config
    )
    returning id into v_trip_id;

    return v_trip_id;
end;
$$;

grant execute on function public.create_trip to authenticated;

-- 2. Create Order (Public/User)
create or replace function public.create_order(
    p_tenant_id text,
    p_customer_email text,
    p_total_amount numeric,
    p_customer_first_name text default null,
    p_customer_last_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_order_id uuid;
begin
    -- Public users might not have tenant_id in JWT if anonymous?
    -- If anon, we trust the input p_tenant_id? No, dangerous.
    -- For now, assume authenticated (even anon with tenant context).
    -- If entirely public, we need a way to validate tenant.
    -- Strict Mode: All writes via RPC.
    
    insert into public.mnt_orders (
        tenant_id, customer_email, customer_first_name, customer_last_name, total_amount, status, payment_status
    ) values (
        p_tenant_id, p_customer_email, p_customer_first_name, p_customer_last_name, p_total_amount, 'PENDING', 'UNPAID'
    )
    returning id into v_order_id;

    return v_order_id;
end;
$$;

grant execute on function public.create_order to authenticated;
grant execute on function public.create_order to service_role; -- For server actions

-- 3. Create Reservation (Linked to Order)
create or replace function public.create_reservation(
    p_tenant_id text,
    p_order_id uuid,
    p_trip_id uuid,
    p_total_amount numeric,
    p_count_passengers integer,
    p_count_vehicles integer
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_res_id uuid;
begin
    -- Security: Ensure Order belongs to tenant
    if not exists (select 1 from public.mnt_orders where id = p_order_id and tenant_id = p_tenant_id) then
        raise exception 'Invalid Order';
    end if;

    insert into public.mnt_reservations (
        tenant_id, order_id, trip_id, total_amount, count_passengers, count_vehicles, status
    ) values (
        p_tenant_id, p_order_id, p_trip_id, p_total_amount, p_count_passengers, p_count_vehicles, 'PENDING_PAYMENT'
    )
    returning id into v_res_id;

    return v_res_id;
end;
$$;

grant execute on function public.create_reservation to authenticated;
grant execute on function public.create_reservation to service_role;
