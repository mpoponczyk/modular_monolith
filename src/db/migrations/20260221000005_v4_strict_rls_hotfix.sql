BEGIN;

-- ==============================================================================
-- PHASE 4: RLS ARCH POST-MORTEM FIXES
-- ==============================================================================

-- 1. Performance Fix: Convert Context Getter to STABLE
-- previously VOLATILE by default, causing N+1 evaluation per row during RLS
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


-- 2. Discovery Fix: Organizations "Chicken & Egg" Lockout
-- The UI needs to discover organizations the user belongs to before it can request one.
DROP POLICY IF EXISTS "v4_org_strict_select" ON public.organizations;
CREATE POLICY "v4_org_strict_select" ON public.organizations FOR SELECT TO authenticated
USING (
    (
        public.get_requested_org_id() IS NULL 
        OR 
        id = public.get_requested_org_id()
    )
    AND public.verify_org_membership(id)
);

COMMIT;
