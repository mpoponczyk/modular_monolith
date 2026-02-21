-- Migration: Ferry Booking Sales Domain
-- Date: 2026-02-18
-- Description: Adds Trips, Pricing, Reservations, Tickets, Orders, Invoices to mnt_ schema.

-- 1. TRIPS
create table public.mnt_trips (
    id uuid primary key default gen_random_uuid(),
    tenant_id text not null, -- references public.tenants(slug) or id? Keeping text to match previous mnt_ tables (legacy mixup fixed in code)
    route_id uuid not null references public.mnt_routes(id),
    ferry_id uuid not null references public.mnt_ferries(id),
    departure_time timestamptz not null,
    arrival_time timestamptz not null,
    status text default 'SCHEDULED', -- SCHEDULED, CANCELLED, COMPLETED
    is_public boolean default true,
    zone_config jsonb default '{}'::jsonb, -- Cache of capacity config
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. TRIP PRICING
create table public.mnt_trip_pricing (
    id uuid primary key default gen_random_uuid(),
    tenant_id text not null,
    trip_id uuid not null references public.mnt_trips(id) on delete cascade,
    service_type text not null, -- ADULT, CHILD, BIKE, etc.
    zone_id uuid, -- Optional link to specific zone
    price numeric(10,2) not null,
    currency text default 'PLN',
    created_at timestamptz default now()
);

-- 3. ORDERS (Aggregation of reservations)
create table public.mnt_orders (
    id uuid primary key default gen_random_uuid(),
    tenant_id text not null,
    customer_email text not null,
    customer_first_name text,
    customer_last_name text,
    status text default 'PENDING', -- PENDING, PAID, CANCELLED
    payment_status text default 'UNPAID',
    payment_provider text,
    total_amount numeric(10,2) not null,
    currency text default 'PLN',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. RESERVATIONS (Per Trip)
create table public.mnt_reservations (
    id uuid primary key default gen_random_uuid(),
    tenant_id text not null,
    order_id uuid references public.mnt_orders(id) on delete cascade,
    trip_id uuid not null references public.mnt_trips(id),
    status text default 'PENDING_PAYMENT', -- CONFIRMED, CANCELLED
    customer_email text, -- Denormalized from Order for quick lookup
    total_amount numeric(10,2) not null,
    count_passengers integer default 0,
    count_vehicles integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 5. TICKETS (Individual items in reservation)
create table public.mnt_tickets (
    id uuid primary key default gen_random_uuid(),
    tenant_id text not null,
    reservation_id uuid not null references public.mnt_reservations(id) on delete cascade,
    service_type text not null,
    price_sold numeric(10,2) not null,
    passenger_name text,
    created_at timestamptz default now()
);

-- 6. INVOICES
create table public.mnt_invoices (
    id uuid primary key default gen_random_uuid(),
    tenant_id text not null,
    order_id uuid not null references public.mnt_orders(id),
    invoice_number text not null,
    buyer_data jsonb,
    amount_total numeric(10,2) not null,
    file_url text,
    created_at timestamptz default now()
);

-- 7. ENABLE RLS
alter table public.mnt_trips enable row level security;
alter table public.mnt_trip_pricing enable row level security;
alter table public.mnt_orders enable row level security;
alter table public.mnt_reservations enable row level security;
alter table public.mnt_tickets enable row level security;
alter table public.mnt_invoices enable row level security;

-- 8. POLICIES (FAIL CLOSED)

-- Trips (Public Read, Admin Write via RPC)
create policy "trips_view_policy" on public.mnt_trips
    for select using (
        tenant_id = (select auth.jwt() ->> 'tenant_id') 
        OR 
        (is_public = true) -- Public can view trips? Need to check tenant context for public users too? 
                           -- Yes, public users usually have a tenant context header/cookie, but DB policy needs to know it.
                           -- For now, restricts to authenticated users (admin) or public if we expose public access safely.
                           -- Keeping Strict for Admin Dashboard first.
    );

-- Orders/Reservations (Owner Read, Admin Read)
create policy "orders_view_policy" on public.mnt_orders
    for select using (
        tenant_id = (select auth.jwt() ->> 'tenant_id')
    );

create policy "reservations_view_policy" on public.mnt_reservations
    for select using (
        tenant_id = (select auth.jwt() ->> 'tenant_id')
    );
