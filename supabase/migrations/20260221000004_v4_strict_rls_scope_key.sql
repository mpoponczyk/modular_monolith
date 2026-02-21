-- Migration: 20260221000004_v4_strict_rls_scope_key.sql
-- Description: Applies strict V4 Row Level Security (RLS) to organizations, companies, and projects
-- leveraging the scope_key materialized path and STABLE context functions for optimal query planning.

BEGIN;

-- 1. Ensure `get_requested_org_id` is STABLE for optimal RLS index scan evaluation
CREATE OR REPLACE FUNCTION public.get_requested_org_id() RETURNS UUID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions, auth
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

-- 2. Ensure `get_tenant_id` helper is STABLE and optimized
CREATE OR REPLACE FUNCTION public.get_tenant_id() RETURNS UUID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claim.tenant_id', true),
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')
    )::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


-- ==========================================
-- TABLE: ORGANIZATIONS
-- ==========================================
DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select_v4" ON public.organizations FOR SELECT TO authenticated
USING (
    tenant_id = public.get_tenant_id()
    AND (
        public.get_requested_org_id() IS NULL
        OR id = public.get_requested_org_id()
    )
    AND (
        -- Path 1: Org Owner Member
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = organizations.owner_group_id
              AND gm.user_id = auth.uid()
              AND gm.tenant_id = organizations.tenant_id
        )
        OR
        -- Path 2: Member of Linked Company
        EXISTS (
            SELECT 1 FROM public.org_companies oc
            JOIN public.company_users cu ON cu.company_id = oc.company_id
            WHERE oc.organization_id = organizations.id
              AND cu.user_id = auth.uid()
              AND oc.tenant_id = organizations.tenant_id
              AND cu.tenant_id = organizations.tenant_id
        )
    )
);

-- ==========================================
-- TABLE: COMPANIES
-- ==========================================
DROP POLICY IF EXISTS "company_select" ON public.companies;
CREATE POLICY "company_select_v4" ON public.companies FOR SELECT TO authenticated
USING (
    tenant_id = public.get_tenant_id()
    AND (
        public.get_requested_org_id() IS NULL
        OR EXISTS (
            SELECT 1 FROM public.org_companies oc
            WHERE oc.company_id = companies.id
              AND oc.organization_id = public.get_requested_org_id()
              AND oc.tenant_id = companies.tenant_id
        )
    )
    AND (
        -- Path 1: Direct Company Member
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.company_id = companies.id
              AND cu.user_id = auth.uid()
              AND cu.tenant_id = companies.tenant_id
        )
        OR
        -- Path 2: Org Owner of a Linked Org
        EXISTS (
            SELECT 1 FROM public.org_companies oc
            JOIN public.organizations o ON o.id = oc.organization_id
            JOIN public.group_members gm ON gm.group_id = o.owner_group_id
            WHERE oc.company_id = companies.id
              AND gm.user_id = auth.uid()
              AND oc.tenant_id = companies.tenant_id
              AND o.tenant_id = companies.tenant_id
              AND gm.tenant_id = companies.tenant_id
        )
    )
);

-- ==========================================
-- TABLE: PROJECTS
-- ==========================================
DROP POLICY IF EXISTS "project_select" ON public.projects;
CREATE POLICY "project_select_v4" ON public.projects FOR SELECT TO authenticated
USING (
    tenant_id = public.get_tenant_id()
    AND (
        public.get_requested_org_id() IS NULL
        OR scope_key LIKE ('t:' || tenant_id || '/o:' || public.get_requested_org_id() || '/%')
    )
    AND (
        -- Path 1: Org Owner of Parent Org
        EXISTS (
            SELECT 1 FROM public.organizations o
            JOIN public.group_members gm ON gm.group_id = o.owner_group_id
            WHERE o.id = projects.organization_id
              AND gm.user_id = auth.uid()
              AND o.tenant_id = projects.tenant_id
              AND gm.tenant_id = projects.tenant_id
        )
        OR
        -- Path 2: Direct Company Member on Project
        EXISTS (
            SELECT 1 FROM public.project_companies pc
            JOIN public.company_users cu ON cu.company_id = pc.company_id
            WHERE pc.project_id = projects.id
              AND cu.user_id = auth.uid()
              AND pc.tenant_id = projects.tenant_id
              AND cu.tenant_id = projects.tenant_id
        )
    )
);

-- Ensure base permissions remain tight
REVOKE INSERT, UPDATE, DELETE ON public.organizations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.companies FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.projects FROM authenticated;

COMMIT;
