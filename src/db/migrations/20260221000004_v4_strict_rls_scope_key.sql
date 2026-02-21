BEGIN;

-- ==============================================================================
-- PHASE 3: STRICT MATERIALIZED PATH RLS
-- ==============================================================================

-- 1. Optimized Membership Helper
-- This STABLE function allows PostgreSQL to cache the membership result per-query,
-- avoiding expensive joins across the `organizations`, `companies`, and `projects` RLS evaluation rows.
CREATE OR REPLACE FUNCTION public.verify_org_membership(p_org_id uuid) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_is_member BOOLEAN;
BEGIN
    IF p_org_id IS NULL THEN RETURN FALSE; END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.organizations org
        WHERE org.id = p_org_id
        AND (
            -- Owner Group
            org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) 
            OR
            -- Company Link Member
            EXISTS (
                SELECT 1 FROM public.org_companies oc
                JOIN public.company_users cu ON cu.company_id = oc.company_id
                WHERE oc.organization_id = p_org_id AND cu.user_id = auth.uid()
            )
        )
    ) INTO v_is_member;

    RETURN v_is_member;
END;
$$;
GRANT EXECUTE ON FUNCTION public.verify_org_membership(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.verify_org_membership(uuid) FROM public, anon;


-- 2. Organizations RLS Rewrite
DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "v4_org_strict_select" ON public.organizations FOR SELECT TO authenticated
USING (
    -- Must be the explicitly requested organization context
    id = public.get_requested_org_id()
    -- Must actually be a member of it
    AND public.verify_org_membership(public.get_requested_org_id())
);

-- 3. Projects RLS Rewrite (Materialized Path Subtree Matching)
DROP POLICY IF EXISTS "project_select" ON public.projects;
CREATE POLICY "v4_project_strict_select" ON public.projects FOR SELECT TO authenticated
USING (
    -- Fast Prefix Match: t:<tenant>/o:<requested_org>/%
    scope_key LIKE 't:' || tenant_id || '/o:' || public.get_requested_org_id() || '/%'
    AND public.verify_org_membership(public.get_requested_org_id())
);

-- 4. Companies RLS Rewrite
-- Companies are M:N mapped via org_companies, so we verify if they link to the requested Org.
DROP POLICY IF EXISTS "company_select" ON public.companies;
CREATE POLICY "v4_company_strict_select" ON public.companies FOR SELECT TO authenticated
USING (
    -- Request context must be provided and valid
    public.verify_org_membership(public.get_requested_org_id())
    AND EXISTS (
        SELECT 1 FROM public.org_companies oc 
        WHERE oc.company_id = id 
        AND oc.organization_id = public.get_requested_org_id()
    )
);

-- 5. Organization Apps (Batch 4 mapping)
DROP POLICY IF EXISTS "Org Member Read" ON public.organization_apps;
CREATE POLICY "v4_org_apps_strict_select" ON public.organization_apps FOR SELECT TO authenticated
USING (
    organization_id = public.get_requested_org_id()
    AND public.verify_org_membership(public.get_requested_org_id())
);

COMMIT;
