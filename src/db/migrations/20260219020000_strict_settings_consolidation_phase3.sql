-- Migration: 20260219020000_strict_settings_consolidation_phase3.sql
-- Description: Phase 3 of Settings Consolidation (Dual Read / Fallback)

-- Update RPC: get_tenant_settings with Fallback Logic
CREATE OR REPLACE FUNCTION public.get_tenant_settings(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_result JSONB;
    v_sys_settings RECORD;
BEGIN
    -- Authorization: Member check
    IF NOT EXISTS (SELECT 1 FROM public.tenant_users WHERE tenant_id = p_tenant_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- 1. Try to read from NEW strict table
    SELECT to_jsonb(t) INTO v_result FROM public.tenant_settings t WHERE t.tenant_id = p_tenant_id;
    
    -- 2. If Found, Return immediately
    IF v_result IS NOT NULL THEN
        RETURN v_result;
    END IF;

    -- 3. FALLBACK: Try to read from LEGACY sys_settings
    -- Note: sys_settings might not exist or be empty, handled by exception block or left join logic if needed
    -- But since we are inside PLPGSQL, we can check existence safely via dynamic SQL if table existence is uncertain,
    -- OR just assume it exists if consistent. Given previous audit, it exists.
    
    BEGIN
        SELECT * INTO v_sys_settings FROM public.sys_settings WHERE tenant_id = p_tenant_id;
        
        IF FOUND THEN
            -- Map legacy columns to strict structure
            RETURN jsonb_build_object(
                'tenant_id', p_tenant_id,
                'portal_name', 'My Portal', -- Default
                'branding_json', '{}'::jsonb, -- Default
                'locale', 'en', -- Default
                'theme', COALESCE(v_sys_settings.theme, 'light'),
                'date_format', COALESCE(v_sys_settings.date_format, 'DD/MM/YYYY'),
                'currency', COALESCE(v_sys_settings.currency, 'USD'),
                'support_email', v_sys_settings.email_sender_address,
                'support_phone', v_sys_settings.support_phone,
                'timezone', 'UTC', -- Default
                'brand_color', '#000000', -- Default
                'logo_url', NULL, -- Default
                'feature_flags', '{}'::jsonb
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Table might not exist or other error, ignore and return default
        NULL;
    END;

    -- 4. Default if nothing found anywhere
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
