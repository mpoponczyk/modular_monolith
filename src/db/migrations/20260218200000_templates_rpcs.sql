
-- 20260218200000_templates_rpcs.sql

BEGIN;

-- Create Template RPC
CREATE OR REPLACE FUNCTION public.create_template(
    p_tenant_id uuid,
    p_name text,
    p_description text,
    p_start_date date,
    p_end_date date,
    p_is_active boolean
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_id uuid;
BEGIN
    -- Check Authorization
    IF NOT public.authorize('planning.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing planning.manage permission';
    END IF;

    INSERT INTO public.mnt_templates (tenant_id, name, description, start_date, end_date, is_active)
    VALUES (p_tenant_id, p_name, p_description, p_start_date, p_end_date, p_is_active)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Update Template RPC
CREATE OR REPLACE FUNCTION public.update_template(
    p_tenant_id uuid,
    p_template_id uuid,
    p_name text,
    p_description text,
    p_start_date date,
    p_end_date date,
    p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('planning.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing planning.manage permission';
    END IF;

    UPDATE public.mnt_templates
    SET 
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        start_date = COALESCE(p_start_date, start_date),
        end_date = COALESCE(p_end_date, end_date),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE id = p_template_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or access denied';
    END IF;
END;
$$;

-- Delete Template RPC
CREATE OR REPLACE FUNCTION public.delete_template(
    p_tenant_id uuid,
    p_template_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('planning.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing planning.manage permission';
    END IF;

    DELETE FROM public.mnt_templates
    WHERE id = p_template_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or access denied';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_template(uuid, text, text, date, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_template(uuid, uuid, text, text, date, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_template(uuid, uuid) TO authenticated;

COMMIT;
