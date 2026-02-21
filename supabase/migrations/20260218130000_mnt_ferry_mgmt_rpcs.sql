-- Migration: Admin Management RPCs
-- Date: 2026-02-18
-- Description: RPCs for Managing Trips, Reservations, and Orders (Admin Side).

-- 1. Delete Trip
create or replace function public.delete_trip(
    p_tenant_id text,
    p_trip_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
    -- Strict Tenant Check
    if auth.jwt() ->> 'tenant_id' <> p_tenant_id then
        raise exception 'Tenant mismatch';
    end if;

    delete from public.mnt_trips
    where id = p_trip_id and tenant_id = p_tenant_id;
end;
$$;

grant execute on function public.delete_trip to authenticated;

-- 2. Update Trip
create or replace function public.update_trip(
    p_tenant_id text,
    p_trip_id uuid,
    p_departure_time timestamptz default null,
    p_arrival_time timestamptz default null,
    p_is_public boolean default null,
    p_zone_config jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
    -- Strict Tenant Check
    if auth.jwt() ->> 'tenant_id' <> p_tenant_id then
        raise exception 'Tenant mismatch';
    end if;

    update public.mnt_trips
    set
        departure_time = coalesce(p_departure_time, departure_time),
        arrival_time = coalesce(p_arrival_time, arrival_time),
        is_public = coalesce(p_is_public, is_public),
        zone_config = coalesce(p_zone_config, zone_config),
        updated_at = now()
    where id = p_trip_id and tenant_id = p_tenant_id;
end;
$$;

grant execute on function public.update_trip to authenticated;


-- 3. Cancel Reservation
create or replace function public.cancel_reservation(
    p_tenant_id text,
    p_reservation_id uuid,
    p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
    -- Strict Tenant Check
    if auth.jwt() ->> 'tenant_id' <> p_tenant_id then
        raise exception 'Tenant mismatch';
    end if;

    update public.mnt_reservations
    set
        status = 'CANCELLED',
        updated_at = now()
        -- could store p_reason in a note field if schema supported it
    where id = p_reservation_id and tenant_id = p_tenant_id;
end;
$$;

grant execute on function public.cancel_reservation to authenticated;
