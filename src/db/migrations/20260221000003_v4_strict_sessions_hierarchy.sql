BEGIN;

-- ==============================================================================
-- PHASE 1: HIERARCHY MATERIALIZED PATH (scope_key)
-- ==============================================================================

-- 1. Add scope_key columns
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS scope_key TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS scope_key TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS scope_key TEXT;

-- 2. Index them for fast LIKE prefix matching
CREATE INDEX IF NOT EXISTS idx_organizations_scope_key ON public.organizations(scope_key text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_companies_scope_key ON public.companies(scope_key text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_projects_scope_key ON public.projects(scope_key text_pattern_ops);

-- 3. Triggers for generating scope_key
-- Organizations: t:<tenant_id>/o:<id>/
CREATE OR REPLACE FUNCTION public.trg_organizations_scope_key() RETURNS TRIGGER AS $$
BEGIN
    NEW.scope_key := 't:' || NEW.tenant_id || '/o:' || NEW.id || '/';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_organizations_scope_key_trg ON public.organizations;
CREATE TRIGGER trg_organizations_scope_key_trg
    BEFORE INSERT OR UPDATE OF tenant_id ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.trg_organizations_scope_key();

-- Companies: Since companies link M:N via org_companies, we give them a generic tenant-level scope key 
-- to allow flexible filtering, enforcing Org boundaries via the link table instead.
CREATE OR REPLACE FUNCTION public.trg_companies_scope_key() RETURNS TRIGGER AS $$
BEGIN
    NEW.scope_key := 't:' || NEW.tenant_id || '/c:' || NEW.id || '/';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_companies_scope_key_trg ON public.companies;
CREATE TRIGGER trg_companies_scope_key_trg
    BEFORE INSERT OR UPDATE OF tenant_id ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.trg_companies_scope_key();

-- Projects: t:<tenant_id>/o:<organization_id>/p:<id>/
CREATE OR REPLACE FUNCTION public.trg_projects_scope_key() RETURNS TRIGGER AS $$
BEGIN
    NEW.scope_key := 't:' || NEW.tenant_id || '/o:' || NEW.organization_id || '/p:' || NEW.id || '/';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_projects_scope_key_trg ON public.projects;
CREATE TRIGGER trg_projects_scope_key_trg
    BEFORE INSERT OR UPDATE OF tenant_id, organization_id ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.trg_projects_scope_key();

-- 4. Backfill existing data
UPDATE public.organizations SET scope_key = 't:' || tenant_id || '/o:' || id || '/' WHERE scope_key IS NULL;
UPDATE public.companies SET scope_key = 't:' || tenant_id || '/c:' || id || '/' WHERE scope_key IS NULL;
UPDATE public.projects SET scope_key = 't:' || tenant_id || '/o:' || organization_id || '/p:' || id || '/' WHERE scope_key IS NULL;


-- ==============================================================================
-- PHASE 2: REQUEST CONTEXT HELPER
-- ==============================================================================

-- Reads X-ORG-ID from PostgREST request headers safely
CREATE OR REPLACE FUNCTION public.get_requested_org_id() RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    header_val text;
BEGIN
    header_val := NULLIF(current_setting('request.headers', true)::jsonb ->> 'x-org-id', '');
    IF header_val IS NOT NULL THEN
        RETURN header_val::uuid;
    END IF;
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.get_requested_org_id() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_requested_org_id() TO authenticated;


-- ==============================================================================
-- PHASE 5: SEED PERMISSION KEYS
-- ==============================================================================

INSERT INTO public.permissions (key, description) VALUES 
('security.manage', 'Legacy: Manage Security & Sessions'),
('sessions.view.tenant', 'View all sessions in the tenant'),
('sessions.manage.tenant', 'Manage all sessions in the tenant'),
('sessions.view.org', 'View sessions within the organization'),
('sessions.manage.org', 'Manage sessions within the organization')
ON CONFLICT (key) DO NOTHING;


-- ==============================================================================
-- PHASE 6: DUAL-SCOPE SESSION RPCs (CAPABILITY-BASED, NO ROLE NAMES)
-- ==============================================================================

-- Safely drop old RPCs to replace them with the new signatures
DROP FUNCTION IF EXISTS public.get_tenant_auth_sessions(uuid);
DROP FUNCTION IF EXISTS public.revoke_tenant_auth_session(uuid, uuid);

-- New Dual-Scope Fetch
CREATE OR REPLACE FUNCTION public.get_auth_sessions(p_tenant_id uuid, p_org_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  factor_id uuid,
  aal text,
  not_after timestamptz,
  refreshed_at timestamptz,
  user_agent text,
  ip text,
  tag text,
  mfa_amr_claims jsonb,
  first_name text,
  last_name text,
  email varchar,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_has_tenant_view boolean := false;
    v_has_org_view boolean := false;
    v_org_scope_key text;
BEGIN
    -- 1. Tenant Membership Verification
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied: Not a member of this tenant';
    END IF;

    -- 2. Capability Check (Tenant Scope)
    -- Look for 'sessions.view.tenant' OR 'security.view' (legacy allowance)
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_users tu
        JOIN public.roles r ON tu.role_id = r.id
        JOIN public.role_permissions rp ON r.id = rp.role_id
        JOIN public.permissions p ON rp.permission_key = p.key
        WHERE tu.tenant_id = p_tenant_id 
          AND tu.user_id = auth.uid()
          AND p.key IN ('sessions.view.tenant', 'security.view')
    ) INTO v_has_tenant_view;

    IF v_has_tenant_view THEN
        -- Return all sessions for users in this tenant
        RETURN QUERY
        SELECT 
            s.id, s.user_id, s.created_at, s.updated_at, s.factor_id, s.aal, s.not_after, s.refreshed_at, s.user_agent, s.ip::text, s.tag, s.mfa_amr_claims,
            COALESCE(u.raw_user_meta_data->>'first_name', split_part(pr.full_name, ' ', 1), 'Admin') as first_name,
            COALESCE(u.raw_user_meta_data->>'last_name', split_part(pr.full_name, ' ', 2), '') as last_name,
            u.email::varchar,
            (u.banned_until IS NULL) as is_active
        FROM auth.sessions s
        JOIN auth.users u ON u.id = s.user_id
        LEFT JOIN public.profiles pr ON pr.id = s.user_id
        WHERE s.user_id IN (
            SELECT tu.user_id FROM public.tenant_users tu WHERE tu.tenant_id = p_tenant_id
        );
        RETURN;
    END IF;

    -- 3. Capability Check (Org Scope)
    IF p_org_id IS NOT NULL THEN
        -- Verify Org Membership explicitly
        IF NOT EXISTS (
            SELECT 1 FROM public.organizations org
            WHERE org.id = p_org_id AND org.tenant_id = p_tenant_id
            AND (
                -- Owner Group
                org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) OR
                -- Company Member Wrapper
                EXISTS (
                    SELECT 1 FROM public.org_companies oc
                    JOIN public.company_users cu ON cu.company_id = oc.company_id
                    WHERE oc.organization_id = p_org_id AND cu.user_id = auth.uid()
                )
            )
        ) THEN
            RAISE EXCEPTION 'Access Denied: Not a member of this organization';
        END IF;

        -- Check Org Permission
        SELECT EXISTS (
             SELECT 1 FROM public.company_users cu
             JOIN public.company_roles cr ON cu.role_id = cr.id
             JOIN public.company_role_permissions crp ON cr.id = crp.role_id
             JOIN public.permissions p ON crp.permission_id = p.key
             JOIN public.org_companies oc ON cu.company_id = oc.company_id
             WHERE oc.organization_id = p_org_id 
               AND cu.user_id = auth.uid()
               AND p.key = 'sessions.view.org'
        ) INTO v_has_org_view;

        IF v_has_org_view THEN
            -- Get Org Scope Key to filter sessions
            SELECT scope_key INTO v_org_scope_key FROM public.organizations WHERE id = p_org_id;
            
            RETURN QUERY
            SELECT 
                s.id, s.user_id, s.created_at, s.updated_at, s.factor_id, s.aal, s.not_after, s.refreshed_at, s.user_agent, s.ip::text, s.tag, s.mfa_amr_claims,
                COALESCE(u.raw_user_meta_data->>'first_name', split_part(pr.full_name, ' ', 1), 'Admin') as first_name,
                COALESCE(u.raw_user_meta_data->>'last_name', split_part(pr.full_name, ' ', 2), '') as last_name,
                u.email::varchar,
                (u.banned_until IS NULL) as is_active
            FROM auth.sessions s
            JOIN auth.users u ON u.id = s.user_id
            LEFT JOIN public.profiles pr ON pr.id = s.user_id
            WHERE s.user_id IN (
                SELECT cu.user_id FROM public.company_users cu
                JOIN public.org_companies oc ON cu.company_id = oc.company_id
                WHERE oc.organization_id = p_org_id
            );
            RETURN;
        END IF;
    END IF;

    -- If no capabilities match
    RAISE EXCEPTION 'Access Denied: Missing session view capabilities';
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_auth_sessions(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_auth_sessions(uuid, uuid) FROM public, anon;


-- New Dual-Scope Revoke
CREATE OR REPLACE FUNCTION public.revoke_auth_session(p_tenant_id uuid, p_session_id uuid, p_org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_has_tenant_manage boolean := false;
    v_has_org_manage boolean := false;
    v_target_user_id uuid;
BEGIN
    -- 1. Get Target Session User
    SELECT user_id INTO v_target_user_id FROM auth.sessions WHERE id = p_session_id;
    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Session not found';
    END IF;

    -- 2. Target User must be in Tenant
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE tenant_id = p_tenant_id AND user_id = v_target_user_id
    ) THEN
        RAISE EXCEPTION 'Invalid target session: User not in tenant';
    END IF;

    -- 3. Invoker Tenant Membership Verification
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied: Not a member of this tenant';
    END IF;

    -- 4. Capability Check (Tenant Scope)
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_users tu
        JOIN public.roles r ON tu.role_id = r.id
        JOIN public.role_permissions rp ON r.id = rp.role_id
        JOIN public.permissions p ON rp.permission_key = p.key
        WHERE tu.tenant_id = p_tenant_id 
          AND tu.user_id = auth.uid()
          AND p.key IN ('sessions.manage.tenant', 'security.manage')
    ) INTO v_has_tenant_manage;

    IF v_has_tenant_manage THEN
        DELETE FROM auth.sessions WHERE id = p_session_id AND user_id = v_target_user_id;
        RETURN;
    END IF;

    -- 5. Capability Check (Org Scope)
    IF p_org_id IS NOT NULL THEN
        SELECT EXISTS (
             SELECT 1 FROM public.company_users cu
             JOIN public.company_roles cr ON cu.role_id = cr.id
             JOIN public.company_role_permissions crp ON cr.id = crp.role_id
             JOIN public.permissions p ON crp.permission_id = p.key
             JOIN public.org_companies oc ON cu.company_id = oc.company_id
             WHERE oc.organization_id = p_org_id 
               AND cu.user_id = auth.uid()
               AND p.key = 'sessions.manage.org'
        ) INTO v_has_org_manage;

        IF v_has_org_manage THEN
            -- Target user must also be in this org
            IF NOT EXISTS (
                SELECT 1 FROM public.company_users cu
                JOIN public.org_companies oc ON cu.company_id = oc.company_id
                WHERE oc.organization_id = p_org_id AND cu.user_id = v_target_user_id
            ) THEN
                RAISE EXCEPTION 'Access Denied: Target user is not in your organization';
            END IF;

            DELETE FROM auth.sessions WHERE id = p_session_id AND user_id = v_target_user_id;
            RETURN;
        END IF;
    END IF;

    -- If no capabilities match
    RAISE EXCEPTION 'Access Denied: Missing session manage capabilities';
END;
$$;
GRANT EXECUTE ON FUNCTION public.revoke_auth_session(uuid, uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.revoke_auth_session(uuid, uuid, uuid) FROM public, anon;

COMMIT;
