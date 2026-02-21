-- Migration: 20260218230000_batch4_settings.sql
-- Description: Tenant Settings Table and RPCs

-- 1. Table: tenant_settings
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    portal_name TEXT DEFAULT 'My Portal',
    branding_json JSONB DEFAULT '{}'::jsonb, -- Logo, Colors
    locale TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- 2. RLS
CREATE POLICY "Tenant Isolation" ON public.tenant_settings
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- 3. Grants
REVOKE ALL ON public.tenant_settings FROM public, anon;
GRANT SELECT ON public.tenant_settings TO authenticated; -- Allow read for UI bootstrapping

-- 4. RPC: get_tenant_settings
CREATE OR REPLACE FUNCTION public.get_tenant_settings(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Authorization check usually handled by RLS, but for RPCs we can be explicit
    -- Simple check: User is member of tenant
    IF NOT EXISTS (SELECT 1 FROM public.tenant_users WHERE tenant_id = p_tenant_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    SELECT to_jsonb(t) INTO v_result FROM public.tenant_settings t WHERE t.tenant_id = p_tenant_id;
    
    -- Return default if null
    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'tenant_id', p_tenant_id,
            'portal_name', 'My Portal',
            'branding_json', '{}'::jsonb,
            'locale', 'en'
        );
    END IF;

    RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_tenant_settings(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_settings(UUID) TO authenticated;

-- 5. RPC: update_tenant_settings
CREATE OR REPLACE FUNCTION public.update_tenant_settings(
    p_tenant_id UUID,
    p_portal_name TEXT,
    p_branding_json JSONB,
    p_locale TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Authorization: Check permission 'settings.manage' (Phase 3 introduced permissions)
    IF NOT public.authorize('settings.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing settings.manage permission';
    END IF;

    INSERT INTO public.tenant_settings (tenant_id, portal_name, branding_json, locale, updated_at)
    VALUES (p_tenant_id, p_portal_name, p_branding_json, p_locale, now())
    ON CONFLICT (tenant_id) DO UPDATE SET
        portal_name = EXCLUDED.portal_name,
        branding_json = EXCLUDED.branding_json,
        locale = EXCLUDED.locale,
        updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.update_tenant_settings(UUID, TEXT, JSONB, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_tenant_settings(UUID, TEXT, JSONB, TEXT) TO authenticated;
