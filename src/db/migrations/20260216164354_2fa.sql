-- Migration: 2FA Login Challenges and Sessions (Strict RPC-Only)
-- Timestamp: 20260216164354

-- 1. Create login_challenges table
CREATE TABLE public.login_challenges (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    code_hash text NOT NULL,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    verified_at timestamptz,
    CONSTRAINT login_challenges_pkey PRIMARY KEY (id),
    CONSTRAINT login_challenges_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT login_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_login_challenges_lookup ON public.login_challenges(tenant_id, user_id, created_at DESC);
CREATE INDEX idx_login_challenges_expires ON public.login_challenges(expires_at);

-- Security: FORCE RLS
ALTER TABLE public.login_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_challenges FORCE ROW LEVEL SECURITY;

-- Revoke all by default
REVOKE ALL ON TABLE public.login_challenges FROM public, anon, authenticated;

-- Policy: Select own rows only (optional, but good for debugging if needed, though app won't use it directly)
-- "Users can see their own challenges"
CREATE POLICY "Users can see own challenges" ON public.login_challenges
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
-- Grant Select ONLY to authenticated
GRANT SELECT ON TABLE public.login_challenges TO authenticated;


-- 2. Create twofa_sessions table (Server-side session registry)
CREATE TABLE public.twofa_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- This is the session_id
    tenant_id uuid NOT NULL,
    tenant_slug text NOT NULL, -- Denormalized for fast check if needed, but primary check is ID
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    last_rotated_at timestamptz DEFAULT now(),
    CONSTRAINT twofa_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT twofa_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT twofa_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_twofa_sessions_lookup ON public.twofa_sessions(tenant_id, user_id);
CREATE INDEX idx_twofa_sessions_validity ON public.twofa_sessions(expires_at, revoked_at);

-- Security: FORCE RLS
ALTER TABLE public.twofa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twofa_sessions FORCE ROW LEVEL SECURITY;

-- Revoke all
REVOKE ALL ON TABLE public.twofa_sessions FROM public, anon, authenticated;

-- Policy: Select own sessions
CREATE POLICY "Users can see own 2fa sessions" ON public.twofa_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

GRANT SELECT ON TABLE public.twofa_sessions TO authenticated;


-- 3. RPC: create_login_challenge
CREATE OR REPLACE FUNCTION public.create_login_challenge(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid;
    v_code text;
    v_hash text;
    v_is_member boolean;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify Tenant Membership
    SELECT EXISTS (
        SELECT 1 FROM tenant_users tu
        WHERE tu.tenant_id = p_tenant_id
        AND tu.user_id = v_user_id
    ) INTO v_is_member;

    IF NOT v_is_member THEN
        RAISE EXCEPTION 'User is not a member of this tenant';
    END IF;

    -- Invalidate previous unverified challenges for this user/tenant
    UPDATE public.login_challenges
    SET expires_at = now()
    WHERE tenant_id = p_tenant_id
    AND user_id = v_user_id
    AND verified_at IS NULL
    AND expires_at > now();

    -- Generate Code (6 digits)
    v_code := floor(random() * (999999 - 100000 + 1) + 100000)::text;
    
    -- Hash Code (using pgcrypto or extension if available, else simple match for now?)
    -- Assuming pgcrypto is enabled. If not, use basic digest.
    -- Better: auth.crypt if available, or just digest.
    -- Let's use simple match for this strict POC, but ideally bcrypt.
    -- Using crypt() from pgcrypto requires extension.
    -- Fallback: md5/sha256 for now if extension unknown? 
    -- Strict mode: We assume extensions like pgcrypto are standard in Supabase.
    IF (SELECT count(*) FROM pg_extension WHERE extname = 'pgcrypto') = 0 THEN
       CREATE EXTENSION IF NOT EXISTS pgcrypto;
    END IF;

    v_hash := crypt(v_code, gen_salt('bf'));

    -- Insert Challenge
    INSERT INTO public.login_challenges (tenant_id, user_id, code_hash, expires_at)
    VALUES (p_tenant_id, v_user_id, v_hash, now() + interval '5 minutes');

    RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.create_login_challenge(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_login_challenge(uuid) TO authenticated;


-- 4. RPC: verify_login_challenge (with Rotation)
CREATE OR REPLACE FUNCTION public.verify_login_challenge(p_tenant_id uuid, p_code text)
RETURNS uuid -- Returns session_id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid;
    v_record record;
    v_tenant_slug text;
    v_new_session_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Find latest valid challenge
    SELECT * INTO v_record
    FROM public.login_challenges
    WHERE tenant_id = p_tenant_id
    AND user_id = v_user_id
    AND verified_at IS NULL
    AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_record IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired code';
    END IF;

    -- Verify Hash
    IF v_record.code_hash != crypt(p_code, v_record.code_hash) THEN
        RAISE EXCEPTION 'Invalid code';
    END IF;

    -- Mark Verified
    UPDATE public.login_challenges
    SET verified_at = now()
    WHERE id = v_record.id;

    -- Tenant Slug Lookup (for session registry)
    SELECT slug INTO v_tenant_slug FROM public.tenants WHERE id = p_tenant_id;

    -- ROTATION: Revoke all existing active sessions for this user/tenant
    UPDATE public.twofa_sessions
    SET revoked_at = now()
    WHERE tenant_id = p_tenant_id
    AND user_id = v_user_id
    AND revoked_at IS NULL;

    -- Create New Session
    v_new_session_id := gen_random_uuid();
    
    INSERT INTO public.twofa_sessions (id, tenant_id, tenant_slug, user_id, expires_at)
    VALUES (
        v_new_session_id,
        p_tenant_id,
        v_tenant_slug,
        v_user_id,
        now() + interval '12 hours'
    );

    RETURN v_new_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_login_challenge(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.verify_login_challenge(uuid, text) TO authenticated;


-- 5. RPC: validate_twofa_session (Server Truth Check)
CREATE OR REPLACE FUNCTION public.validate_twofa_session(p_tenant_id uuid, p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid;
    v_exists boolean;
BEGIN
    v_user_id := auth.uid();
    
    SELECT EXISTS (
        SELECT 1 FROM public.twofa_sessions
        WHERE id = p_session_id
        AND tenant_id = p_tenant_id
        AND user_id = v_user_id
        AND revoked_at IS NULL
        AND expires_at > now()
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_twofa_session(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.validate_twofa_session(uuid, uuid) TO authenticated;
