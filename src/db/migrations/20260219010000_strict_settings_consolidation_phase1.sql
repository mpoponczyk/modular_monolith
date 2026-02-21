-- Migration: 20260219010000_strict_settings_consolidation_phase1.sql
-- Description: Phase 1 of Settings Consolidation (Extension Only)

-- 1. Extend tenant_settings table
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS support_email TEXT,
ADD COLUMN IF NOT EXISTS support_phone TEXT,
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

-- 2. Update RPC: get_tenant_settings
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

    SELECT to_jsonb(t) INTO v_result FROM public.tenant_settings t WHERE t.tenant_id = p_tenant_id;
    
    -- Return default if null (but preserve ID for UI consistency)
    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'tenant_id', p_tenant_id,
            'portal_name', 'My Portal',
            'branding_json', '{}'::jsonb,
            'locale', 'en',
            'theme', 'light',
            'date_format', 'DD/MM/YYYY',
            'currency', 'USD',
            'timezone', 'UTC',
            'feature_flags', '{}'::jsonb
        );
    END IF;

    RETURN v_result;
END;
$$;

-- 3. Update RPC: update_tenant_settings
CREATE OR REPLACE FUNCTION public.update_tenant_settings(
    p_tenant_id UUID,
    p_portal_name TEXT,
    p_branding_json JSONB,
    p_locale TEXT,
    p_theme TEXT,
    p_date_format TEXT,
    p_currency TEXT,
    p_support_email TEXT,
    p_support_phone TEXT,
    p_timezone TEXT,
    p_brand_color TEXT,
    p_logo_url TEXT,
    p_feature_flags JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Authorization: Check permission 'settings.manage'
    IF NOT public.authorize('settings.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing settings.manage permission';
    END IF;

    INSERT INTO public.tenant_settings (
        tenant_id, 
        portal_name, 
        branding_json, 
        locale, 
        theme, 
        date_format, 
        currency, 
        support_email, 
        support_phone, 
        timezone, 
        brand_color, 
        logo_url, 
        feature_flags,
        updated_at
    )
    VALUES (
        p_tenant_id, 
        p_portal_name, 
        p_branding_json, 
        p_locale, 
        p_theme, 
        p_date_format, 
        p_currency, 
        p_support_email, 
        p_support_phone, 
        p_timezone, 
        p_brand_color, 
        p_logo_url, 
        p_feature_flags,
        now()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        portal_name = EXCLUDED.portal_name,
        branding_json = EXCLUDED.branding_json,
        locale = EXCLUDED.locale,
        theme = EXCLUDED.theme,
        date_format = EXCLUDED.date_format,
        currency = EXCLUDED.currency,
        support_email = EXCLUDED.support_email,
        support_phone = EXCLUDED.support_phone,
        timezone = EXCLUDED.timezone,
        brand_color = EXCLUDED.brand_color,
        logo_url = EXCLUDED.logo_url,
        feature_flags = EXCLUDED.feature_flags,
        updated_at = now();
END;
$$;

-- 4. Grants
REVOKE ALL ON FUNCTION public.get_tenant_settings(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_settings(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.update_tenant_settings(UUID, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_tenant_settings(UUID, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
