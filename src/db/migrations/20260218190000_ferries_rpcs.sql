
-- 20260218190000_ferries_rpcs.sql

BEGIN;

-- Update Ferry RPC
CREATE OR REPLACE FUNCTION public.update_ferry(
    p_tenant_id uuid,
    p_ferry_id uuid,
    p_name text,
    p_capacity_pax integer,
    p_capacity_cars integer
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('ferries.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing ferries.manage permission';
    END IF;

    UPDATE public.ferries
    SET 
        name = p_name, 
        capacity_pax = p_capacity_pax, 
        capacity_cars = p_capacity_cars,
        updated_at = now()
    WHERE id = p_ferry_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ferry not found or access denied';
    END IF;
END;
$$;

-- Delete Ferry RPC
CREATE OR REPLACE FUNCTION public.delete_ferry(
    p_tenant_id uuid,
    p_ferry_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('ferries.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing ferries.manage permission';
    END IF;

    DELETE FROM public.ferries
    WHERE id = p_ferry_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ferry not found or access denied';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ferry(uuid, uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_ferry(uuid, uuid) TO authenticated;

COMMIT;
