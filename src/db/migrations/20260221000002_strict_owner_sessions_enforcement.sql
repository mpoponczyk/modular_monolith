-- Migration: 20260221000002_strict_owner_sessions_enforcement.sql
-- Purpose: Enforce strict Organization Owner (Admin) access to session RPCs.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_tenant_auth_sessions(p_tenant_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_agent text,
    ip text,
    first_name text,
    last_name text,
    email varchar,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
#variable_conflict use_column
BEGIN
    -- STRICT OWNER ENFORCEMENT: Verify caller is a member with the 'Owner' or 'UAT_SUPERADMIN' role
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users tu
        JOIN public.roles r ON tu.role_id = r.id
        WHERE tu.tenant_id = p_tenant_id 
          AND tu.user_id = auth.uid()
          AND r.name IN ('Owner', 'UAT_SUPERADMIN')
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only Organization Owners can access session records.';
    END IF;

    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.created_at,
        s.updated_at,
        s.user_agent,
        s.ip::text,
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

CREATE OR REPLACE FUNCTION public.revoke_tenant_auth_session(p_tenant_id uuid, p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_session_user_id uuid;
BEGIN
    -- STRICT OWNER ENFORCEMENT: Verify caller is an 'Owner' or 'UAT_SUPERADMIN'
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users tu
        JOIN public.roles r ON tu.role_id = r.id
        WHERE tu.tenant_id = p_tenant_id 
          AND tu.user_id = auth.uid()
          AND r.name IN ('Owner', 'UAT_SUPERADMIN')
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only Organization Owners can revoke sessions.';
    END IF;

    -- Pre-Delete check: does session belong to this tenant?
    SELECT s.user_id INTO v_session_user_id
    FROM auth.sessions s
    JOIN public.tenant_users tu ON tu.user_id = s.user_id
    WHERE tu.tenant_id = p_tenant_id AND s.id = p_session_id;

    IF v_session_user_id IS NULL THEN
        RAISE EXCEPTION 'Session not found or belongs to another tenant';
    END IF;

    -- Delete the session (This natively invalidates the user's refresh token on Supabase)
    DELETE FROM auth.sessions WHERE id = p_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_tenant_auth_session(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.revoke_tenant_auth_session(uuid, uuid) TO authenticated;

COMMIT;
