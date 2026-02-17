
-- ==============================================================================
-- MANUAL FIX: Resolve Multi-Tenant Conflict
-- Run this in Supabase SQL Editor
-- ==============================================================================

DO $$
DECLARE
    v_user_email text := 'section-admin@example.com';
    v_user_id uuid;
    v_demo_slug text := 'demo-tenant';
    v_demo_id uuid;
BEGIN
    -- 1. Get User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    -- 2. Get Demo Tenant ID
    SELECT id INTO v_demo_id FROM public.tenants WHERE slug = v_demo_slug;

    IF v_user_id IS NOT NULL AND v_demo_id IS NOT NULL THEN
        -- 3. Remove User from Demo Tenant
        DELETE FROM public.tenant_users WHERE tenant_id = v_demo_id AND user_id = v_user_id;
        
        IF FOUND THEN
            RAISE NOTICE '✅ Successfully removed % from %', v_user_email, v_demo_slug;
        ELSE
            RAISE NOTICE 'ℹ️ User was not a member of %', v_demo_slug;
        END IF;
    ELSE
        RAISE NOTICE '❌ User or Tenant not found. UserID: %, TenantID: %', v_user_id, v_demo_id;
    END IF;
END $$;
