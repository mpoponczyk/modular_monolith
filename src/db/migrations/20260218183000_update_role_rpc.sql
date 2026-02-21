
-- Add update_role RPC
CREATE OR REPLACE FUNCTION public.update_role(p_tenant_id uuid, p_role_id uuid, p_name text, p_description text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('roles.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing roles.manage permission';
    END IF;

    UPDATE public.roles
    SET name = p_name, description = p_description, updated_at = now()
    WHERE id = p_role_id AND tenant_id = p_tenant_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_role(uuid, uuid, text, text) TO authenticated;
