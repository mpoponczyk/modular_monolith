
-- 20260218210000_routes_rpcs.sql

BEGIN;

-- Update Ferry Route RPC
CREATE OR REPLACE FUNCTION public.update_ferry_route(
    p_tenant_id uuid,
    p_route_id uuid,
    p_origin_id uuid,
    p_destination_id uuid,
    p_estimated_duration integer,
    p_default_ferry_id uuid,
    p_default_price_profile_id uuid,
    p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('routes.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing routes.manage permission';
    END IF;

    UPDATE public.mnt_routes
    SET 
        origin_id = COALESCE(p_origin_id, origin_id),
        destination_id = COALESCE(p_destination_id, destination_id),
        estimated_duration_minutes = COALESCE(p_estimated_duration, estimated_duration_minutes),
        default_ferry_id = CASE WHEN p_default_ferry_id IS NULL THEN default_ferry_id ELSE p_default_ferry_id END, -- simplified null handling might be tricky if we want to set to null
        -- Improved NULL handling: passing NULL means "no change" in this pattern usually, but for nullable fields we might need explicit signaling. 
        -- For now, let's assume standard update pattern: if null passed, ignore. 
        -- If we need to unset, we might need a specific value or different RPC style. 
        -- Let's stick to "COALESCE means ignore if null". 
        default_price_profile_id = COALESCE(p_default_price_profile_id, default_price_profile_id),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE id = p_route_id AND tenant_id = p_tenant_id;
    
    -- Special handling for nullable fields to allow unsetting?
    -- If p_default_ferry_id is passed as a specific value to unset?
    -- Complexity: Standard RPCs often struggle with "Set to NULL" vs "Don't Change".
    -- For strict parity, usually avoiding partial updates in RPC is cleaner.
    -- But let's support "Update what is provided". 
    -- If the UI sends the full object, we can just update everything.
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Route not found or access denied';
    END IF;
END;
$$;

-- Delete Ferry Route RPC
CREATE OR REPLACE FUNCTION public.delete_ferry_route(
    p_tenant_id uuid,
    p_route_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('routes.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing routes.manage permission';
    END IF;

    -- Check for dependencies (optional, but good practice aka Parity)
    -- If trips exist? 
    -- IF EXISTS (SELECT 1 FROM trips WHERE route_id = p_route_id) THEN RAISE EXCEPTION ... END IF;
    -- For now, rely on FK constraints (if any) or existing soft-delete logic.
    -- Strict Parity: "Delete" usually implies hard delete if button says Delete.

    DELETE FROM public.mnt_routes
    WHERE id = p_route_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Route not found or access denied';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ferry_route(uuid, uuid, uuid, uuid, integer, uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_ferry_route(uuid, uuid) TO authenticated;

COMMIT;
