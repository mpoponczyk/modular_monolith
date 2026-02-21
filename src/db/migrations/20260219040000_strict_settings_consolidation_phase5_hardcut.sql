-- Migration: 20260219040000_strict_settings_consolidation_phase5_hardcut.sql
-- Description: Phase 5 Hard Cut (Remove Fallback Logic from get_tenant_settings)

CREATE OR REPLACE FUNCTION public.get_tenant_settings(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Authorization: Member check
    IF NOT EXISTS (SELECT 1 FROM public.tenant_users WHERE tenant_id = p_tenant_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- 1. Try to read from NEW strict table
    SELECT to_jsonb(t) INTO v_result FROM public.tenant_settings t WHERE t.tenant_id = p_tenant_id;
    
    -- 2. If Found, Return
    IF v_result IS NOT NULL THEN
        RETURN v_result;
    END IF;

    -- 3. Defaults (No more fallback to sys_settings)
    RETURN jsonb_build_object(
        'tenant_id', p_tenant_id,
        'portal_name', 'My Portal',
        'branding_json', '{}'::jsonb,
        'locale', 'en',
        'theme', 'light',
        'date_format', 'DD/MM/YYYY',
        'currency', 'USD',
        'timezone', 'UTC',
        'brand_color', '#000000',
        'feature_flags', '{}'::jsonb
    );
END;
$$;
