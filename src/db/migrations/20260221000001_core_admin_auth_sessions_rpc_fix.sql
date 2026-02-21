-- Drop existing function due to 42P13 (cannot change return type of existing function without drop)
DROP FUNCTION IF EXISTS public.get_tenant_auth_sessions(uuid);

-- Recreate with explicitly casted text types for strict PostgREST serialization
CREATE OR REPLACE FUNCTION public.get_tenant_auth_sessions(p_tenant_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_agent text,
    ip text, -- Changed from inet to text
    first_name text,
    last_name text,
    email varchar,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verify the caller is a member of the requested tenant
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied: User is not a member of this tenant';
    END IF;

    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.created_at,
        s.updated_at,
        s.user_agent,
        s.ip::text, -- Cast inet to text to avoid PostgREST 42804 serialization error
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
