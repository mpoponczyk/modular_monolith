
-- ==============================================================================
-- FINAL FIX SCRIPT: Resolve Test User Conflicts & Verify Setup
-- Run this in Supabase SQL Editor
-- ==============================================================================

DO $$
DECLARE
    -- User Configuration
    v_admin_email text := 'section-admin@example.com';
    v_member_email text := 'section-member@example.com';
    v_tenant_slug text := 'test-section-editor';
    v_org_name text := 'Test Section Org';

    -- Variables
    v_tenant_id uuid;
    v_company_id uuid;
    v_admin_id uuid;
    v_member_id uuid;
    v_sys_owner_role_id uuid;
    v_sys_member_role_id uuid;
    v_comp_owner_role_id uuid;
    v_comp_member_role_id uuid;
    v_count int;
BEGIN
    RAISE NOTICE '🚀 Starting remediation for Test Users...';

    -- 1. Get Tenant ID
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = v_tenant_slug;
    IF v_tenant_id IS NULL THEN 
        RAISE EXCEPTION '❌ Tenant % NOT FOUND! Please run seed script or create manually.', v_tenant_slug; 
    END IF;
    RAISE NOTICE '✅ Target Tenant ID: %', v_tenant_id;

    -- 2. Get User IDs
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;
    SELECT id INTO v_member_id FROM auth.users WHERE email = v_member_email;
    
    IF v_admin_id IS NULL THEN RAISE NOTICE '⚠️ Admin % not found in auth.users', v_admin_email; END IF;
    IF v_member_id IS NULL THEN RAISE NOTICE '⚠️ Member % not found in auth.users', v_member_email; END IF;

    -- 3. RESOLVE CONFLICTS: Remove from OTHER tenants
    -- We want to force strict 1-to-1 mapping for these test users to avoid ambiguity.
    IF v_admin_id IS NOT NULL THEN
        DELETE FROM public.tenant_users WHERE user_id = v_admin_id AND tenant_id != v_tenant_id;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE '🧹 Removed Admin from % other tenant(s).', v_count;
    END IF;

    IF v_member_id IS NOT NULL THEN
        DELETE FROM public.tenant_users WHERE user_id = v_member_id AND tenant_id != v_tenant_id;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE '🧹 Removed Member from % other tenant(s).', v_count;
    END IF;

    -- 4. Ensure System Roles (public.roles)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') THEN
         -- Owner
         SELECT id INTO v_sys_owner_role_id FROM public.roles WHERE tenant_id = v_tenant_id AND name = 'Owner';
         IF v_sys_owner_role_id IS NULL THEN
             INSERT INTO public.roles (tenant_id, name) VALUES (v_tenant_id, 'Owner') RETURNING id INTO v_sys_owner_role_id;
         END IF;
         -- Member
         SELECT id INTO v_sys_member_role_id FROM public.roles WHERE tenant_id = v_tenant_id AND name = 'Member';
         IF v_sys_member_role_id IS NULL THEN
             INSERT INTO public.roles (tenant_id, name) VALUES (v_tenant_id, 'Member') RETURNING id INTO v_sys_member_role_id;
         END IF;
    END IF;

    -- 5. Ensure Company & Roles
    SELECT id INTO v_company_id FROM public.companies WHERE tenant_id = v_tenant_id AND name = v_org_name;
    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (tenant_id, name) VALUES (v_tenant_id, v_org_name) RETURNING id INTO v_company_id;
        RAISE NOTICE '✅ Created Company: %', v_org_name;
    END IF;

    -- Company Roles
    SELECT id INTO v_comp_owner_role_id FROM public.company_roles WHERE company_id = v_company_id AND name = 'Owner';
    IF v_comp_owner_role_id IS NULL THEN
        INSERT INTO public.company_roles (tenant_id, company_id, name) VALUES (v_tenant_id, v_company_id, 'Owner') RETURNING id INTO v_comp_owner_role_id;
    END IF;
    
    SELECT id INTO v_comp_member_role_id FROM public.company_roles WHERE company_id = v_company_id AND name = 'Member';
    IF v_comp_member_role_id IS NULL THEN
        INSERT INTO public.company_roles (tenant_id, company_id, name) VALUES (v_tenant_id, v_company_id, 'Member') RETURNING id INTO v_comp_member_role_id;
    END IF;

    -- 6. Add to Target Tenant (Idempotent)
    IF v_admin_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.tenant_users WHERE tenant_id = v_tenant_id AND user_id = v_admin_id) THEN
            -- Handle role_id constraint if present
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_users' AND column_name = 'role_id') THEN
                 EXECUTE 'INSERT INTO public.tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)'
                 USING v_tenant_id, v_admin_id, v_sys_owner_role_id;
            ELSE
                 INSERT INTO public.tenant_users (tenant_id, user_id) VALUES (v_tenant_id, v_admin_id);
            END IF;
            RAISE NOTICE '✅ Added Admin to Target Tenant.';
        ELSE
            RAISE NOTICE 'ℹ️ Admin already in Target Tenant.';
        END IF;
    END IF;

    IF v_member_id IS NOT NULL THEN
         IF NOT EXISTS (SELECT 1 FROM public.tenant_users WHERE tenant_id = v_tenant_id AND user_id = v_member_id) THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_users' AND column_name = 'role_id') THEN
                 EXECUTE 'INSERT INTO public.tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)'
                 USING v_tenant_id, v_member_id, v_sys_member_role_id;
            ELSE
                 INSERT INTO public.tenant_users (tenant_id, user_id) VALUES (v_tenant_id, v_member_id);
            END IF;
            RAISE NOTICE '✅ Added Member to Target Tenant.';
         ELSE
             RAISE NOTICE 'ℹ️ Member already in Target Tenant.';
         END IF;
    END IF;

    -- 7. Add to Company Users
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO public.company_users (company_id, user_id, tenant_id, role_id) VALUES (v_company_id, v_admin_id, v_tenant_id, v_comp_owner_role_id)
        ON CONFLICT (company_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id, tenant_id = EXCLUDED.tenant_id;
        RAISE NOTICE '✅ Admin assigned Owner role in Company.';
    END IF;

    IF v_member_id IS NOT NULL THEN
        INSERT INTO public.company_users (company_id, user_id, tenant_id, role_id) VALUES (v_company_id, v_member_id, v_tenant_id, v_comp_member_role_id)
        ON CONFLICT (company_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id, tenant_id = EXCLUDED.tenant_id;
        RAISE NOTICE '✅ Member assigned Member role in Company.';
    END IF;

    RAISE NOTICE '=== 🏁 DONE: Test Users Fixed & Cleaned ===';
END $$;
