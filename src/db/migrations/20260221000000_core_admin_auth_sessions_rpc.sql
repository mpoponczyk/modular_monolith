-- Migration: 20260221000000_core_admin_auth_sessions_rpc.sql
-- Purpose: Implement the RPC wrapper for auth.sessions as mandated by Admin Core Blueprint.

BEGIN;

-- 1. RPC to list active auth sessions for a tenant
CREATE OR REPLACE FUNCTION public.get_tenant_auth_sessions(p_tenant_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    user_agent text,
    ip varchar,
    first_name text,
    last_name text,
    email varchar,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    -- Verify calling user has access to this tenant securely
    PERFORM public.verify_tenant_membership(p_tenant_id);

    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.created_at,
        s.updated_at,
        s.user_agent,
        s.ip,
        COALESCE(u.raw_user_meta_data->>'first_name', split_part(p.full_name, ' ', 1), 'Admin') as first_name,
        COALESCE(u.raw_user_meta_data->>'last_name', split_part(p.full_name, ' ', 2), '') as last_name,
        u.email::varchar,
        (u.banned_until IS NULL) as is_active
    FROM auth.sessions s
    JOIN public.tenant_users tu ON tu.user_id = s.user_id
    JOIN auth.users u ON u.id = s.user_id
    LEFT JOIN public.profiles p ON p.id = s.user_id
    WHERE tu.tenant_id = p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_auth_sessions(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_auth_sessions(uuid) TO authenticated;


-- 2. RPC to revoke a specific auth session securely
CREATE OR REPLACE FUNCTION public.revoke_tenant_auth_session(p_tenant_id uuid, p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_session_user_id uuid;
BEGIN
    -- Verify caller access
    PERFORM public.verify_tenant_membership(p_tenant_id);

    -- Look up the session to ensure it belongs to a user in this tenant
    SELECT s.user_id INTO v_session_user_id
    FROM auth.sessions s
    JOIN public.tenant_users tu ON tu.user_id = s.user_id
    WHERE tu.tenant_id = p_tenant_id AND s.id = p_session_id;

    IF v_session_user_id IS NULL THEN
        RAISE EXCEPTION 'Session not found or belongs to another tenant';
    END IF;

    -- Delete the session 
    DELETE FROM auth.sessions WHERE id = p_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_tenant_auth_session(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.revoke_tenant_auth_session(uuid, uuid) TO authenticated;

COMMIT;
