-- Migration: migrate_clnt_data
-- Description: Migrates legacy clnt_* data to mnt_* tables for 'test-zalew' tenant
-- Author: Antigravity

DO $$
DECLARE
    v_tenant_id text;
    v_count integer;
BEGIN
    -- 1. Resolve Tenant ID
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'test-zalew';

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "test-zalew" not found in public.tenants. Skipping migration.';
        RETURN;
    END IF;

    RAISE NOTICE 'Migrating data for Tenant: % (ID: %)', 'test-zalew', v_tenant_id;

    -- 2. Migrate Locations
    INSERT INTO public.mnt_locations (id, tenant_id, name, created_at, updated_at)
    SELECT 
        id, 
        v_tenant_id, 
        name, 
        created_at, 
        updated_at
    FROM public.clnt_locations
    ON CONFLICT (id) DO NOTHING;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % locations.', v_count;


    -- 3. Migrate Ferries
    INSERT INTO public.mnt_ferries (id, tenant_id, name, capacity_passengers, capacity_bikes, capacity_pets, created_at, updated_at)
    SELECT 
        id, 
        v_tenant_id, 
        name, 
        capacity_passengers, 
        capacity_bikes, 
        capacity_pets,
        created_at, 
        updated_at
    FROM public.clnt_ferries
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % ferries.', v_count;


    -- 4. Migrate Routes
    -- Map: origin_id, destination_id, ferry_id -> default_ferry_id
    INSERT INTO public.mnt_routes (
        id, 
        tenant_id, 
        origin_id, 
        destination_id, 
        default_ferry_id, 
        estimated_duration_minutes, 
        created_at, 
        updated_at
    )
    SELECT 
        r.id, 
        v_tenant_id, 
        r.origin_id, 
        r.destination_id, 
        r.ferry_id, -- Maps to default_ferry_id
        r.estimated_duration_minutes,
        r.created_at, 
        r.updated_at
    FROM public.clnt_routes r
    -- Ensure Referential Integrity: Only migrate routes where Origin/Dest/Ferry verify exist in MNT (which we just inserted)
    WHERE EXISTS (SELECT 1 FROM public.mnt_locations l WHERE l.id = r.origin_id)
      AND EXISTS (SELECT 1 FROM public.mnt_locations l WHERE l.id = r.destination_id)
      -- Optional: Ferry might be null in clnt? Snippet says ferry_id uuid (nullable in clnt_routes? Snippet: ferry_id uuid,)
      -- If ferry_id is not null, it must exist.
      AND (r.ferry_id IS NULL OR EXISTS (SELECT 1 FROM public.mnt_ferries f WHERE f.id = r.ferry_id))
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % routes.', v_count;

END $$;
