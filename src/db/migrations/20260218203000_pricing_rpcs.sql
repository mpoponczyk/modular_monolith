
-- 20260218203000_pricing_rpcs.sql

BEGIN;

-- Create Pricing Profile RPC
CREATE OR REPLACE FUNCTION public.create_pricing_profile(
    p_tenant_id uuid,
    p_name text,
    p_description text,
    p_base_price_adult numeric,
    p_base_price_child numeric,
    p_base_price_vehicle numeric,
    p_base_price_bike numeric,
    p_currency text,
    p_is_active boolean
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_id uuid;
BEGIN
    -- Check Authorization
    IF NOT public.authorize('pricing.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing pricing.manage permission';
    END IF;

    INSERT INTO public.mnt_price_profiles (
        tenant_id, name, description, 
        base_price_adult, base_price_child, base_price_vehicle, base_price_bike, 
        currency, is_active
    )
    VALUES (
        p_tenant_id, p_name, p_description, 
        p_base_price_adult, p_base_price_child, p_base_price_vehicle, p_base_price_bike, 
        p_currency, p_is_active
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Update Pricing Profile RPC
CREATE OR REPLACE FUNCTION public.update_pricing_profile(
    p_tenant_id uuid,
    p_profile_id uuid,
    p_name text,
    p_description text,
    p_base_price_adult numeric,
    p_base_price_child numeric,
    p_base_price_vehicle numeric,
    p_base_price_bike numeric,
    p_currency text,
    p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('pricing.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing pricing.manage permission';
    END IF;

    UPDATE public.mnt_price_profiles
    SET 
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        base_price_adult = COALESCE(p_base_price_adult, base_price_adult),
        base_price_child = COALESCE(p_base_price_child, base_price_child),
        base_price_vehicle = COALESCE(p_base_price_vehicle, base_price_vehicle),
        base_price_bike = COALESCE(p_base_price_bike, base_price_bike),
        currency = COALESCE(p_currency, currency),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE id = p_profile_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found or access denied';
    END IF;
END;
$$;

-- Delete Pricing Profile RPC
CREATE OR REPLACE FUNCTION public.delete_pricing_profile(
    p_tenant_id uuid,
    p_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('pricing.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing pricing.manage permission';
    END IF;

    DELETE FROM public.mnt_price_profiles
    WHERE id = p_profile_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found or access denied';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pricing_profile(uuid, text, text, numeric, numeric, numeric, numeric, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_pricing_profile(uuid, uuid, text, text, numeric, numeric, numeric, numeric, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_pricing_profile(uuid, uuid) TO authenticated;

COMMIT;
