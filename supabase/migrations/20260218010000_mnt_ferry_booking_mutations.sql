-- Migration: mnt_ferry_booking_mutations
-- Description: RPCs for Ferry Booking Write Operations (Phase 2)
-- Author: Antigravity

-- 1. Create Route RPC
CREATE OR REPLACE FUNCTION "public"."create_ferry_route"(
    "p_tenant_id" text,
    "p_origin_id" uuid,
    "p_destination_id" uuid,
    "p_estimated_duration" integer DEFAULT 60,
    "p_default_ferry_id" uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses Table RLS (needed as INSERT is blocked)
SET search_path = public
AS $$
DECLARE
    v_id uuid;
    v_user_tenant_id text;
BEGIN
    -- 1. Security Check: Tenant Boundary
    -- Verify the Claims Tenant ID matches the Requested Tenant ID
    -- This ensures a user cannot forge a request for a tenant they are not active in.
    v_user_tenant_id := auth.jwt() ->> 'tenant_id';
    
    IF v_user_tenant_id IS NULL OR v_user_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Access Denied: Tenant Context Mismatch';
    END IF;

    -- 2. Data Integrity Checks (Optional but good practice)
    -- Ensure Origin/Dest belong to the same tenant (RLS on FKs might fail otherwise, but good to fail early)
    -- We skip this for speed, relying on FK constraints (which might see emptiness if RLS applies to lookup).
    -- Since we are SECURITY DEFINER, we see everything.
    -- So we MUST ensure the IDs passed actually belong to the tenant.
    
    IF NOT EXISTS (SELECT 1 FROM mnt_locations WHERE id = p_origin_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Invalid Origin ID for this Tenant';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM mnt_locations WHERE id = p_destination_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Invalid Destination ID for this Tenant';
    END IF;

    -- 3. Insert
    INSERT INTO "public"."mnt_routes" (
        "tenant_id",
        "origin_id",
        "destination_id",
        "estimated_duration_minutes",
        "default_ferry_id"
    ) VALUES (
        p_tenant_id,
        p_origin_id,
        p_destination_id,
        p_estimated_duration,
        p_default_ferry_id
    )
    RETURNING "id" INTO v_id;

    RETURN v_id;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION "public"."create_ferry_route" TO "authenticated";
