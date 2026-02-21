
-- 20260218193000_partners_rpcs.sql

BEGIN;

-- Create Partner RPC
CREATE OR REPLACE FUNCTION public.create_partner(
    p_tenant_id uuid,
    p_name text,
    p_email text,
    p_phone text,
    p_commission_rate numeric,
    p_is_active boolean
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_id uuid;
BEGIN
    -- Check Authorization
    IF NOT public.authorize('partners.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing partners.manage permission';
    END IF;

    INSERT INTO public.mnt_partners (tenant_id, name, email, phone, commission_rate, is_active)
    VALUES (p_tenant_id, p_name, p_email, p_phone, p_commission_rate, p_is_active)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Update Partner RPC
CREATE OR REPLACE FUNCTION public.update_partner(
    p_tenant_id uuid,
    p_partner_id uuid,
    p_name text,
    p_email text,
    p_phone text,
    p_commission_rate numeric,
    p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('partners.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing partners.manage permission';
    END IF;

    UPDATE public.mnt_partners
    SET 
        name = COALESCE(p_name, name),
        email = COALESCE(p_email, email),
        phone = COALESCE(p_phone, phone),
        commission_rate = COALESCE(p_commission_rate, commission_rate),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE id = p_partner_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Partner not found or access denied';
    END IF;
END;
$$;

-- Delete Partner RPC
CREATE OR REPLACE FUNCTION public.delete_partner(
    p_tenant_id uuid,
    p_partner_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('partners.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing partners.manage permission';
    END IF;

    DELETE FROM public.mnt_partners
    WHERE id = p_partner_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Partner not found or access denied';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_partner(uuid, text, text, text, numeric, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_partner(uuid, uuid, text, text, text, numeric, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_partner(uuid, uuid) TO authenticated;

COMMIT;
