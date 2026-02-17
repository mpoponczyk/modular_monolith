
-- ==============================================================================
-- MANUAL FIX SCRIPT (v3): Robust Role Handling
-- Run this in Supabase SQL Editor
-- ==============================================================================

DO $$
DECLARE
    v_tenant_id uuid;
    v_company_id uuid;
    v_admin_id uuid;
    v_member_id uuid;
    v_owner_role_id uuid;
    v_member_role_id uuid;
    v_sys_owner_role_id uuid;
    v_sys_member_role_id uuid;
    
    -- Configuration
    v_tenant_slug text := 'test-section-editor';
    v_admin_email text := 'section-admin@example.com';
    v_member_email text := 'section-member@example.com';
    v_org_name text := 'Test Section Org';
BEGIN
    RAISE NOTICE 'Starting remediation for tenant: %', v_tenant_slug;

    -- 1. Get Tenant ID
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = v_tenant_slug;
    IF v_tenant_id IS NULL THEN 
        RAISE EXCEPTION 'Tenant % not found! Run the seed script first or create it manually.', v_tenant_slug; 
    END IF;
    RAISE NOTICE 'Found Tenant ID: %', v_tenant_id;

    -- 2. Get User IDs (from auth.users)
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;
    SELECT id INTO v_member_id FROM auth.users WHERE email = v_member_email;
    
    IF v_admin_id IS NULL THEN RAISE NOTICE 'WARNING: Admin % not found in auth.users', v_admin_email; END IF;
    IF v_member_id IS NULL THEN RAISE NOTICE 'WARNING: Member % not found in auth.users', v_member_email; END IF;

    -- 3. Ensure System Roles (public.roles) exist effectively
    -- The error 'Role does not exist' likely refers to this table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') THEN
         -- Create Owner Role
         SELECT id INTO v_sys_owner_role_id FROM public.roles WHERE tenant_id = v_tenant_id AND name = 'Owner';
         IF v_sys_owner_role_id IS NULL THEN
             INSERT INTO public.roles (tenant_id, name) VALUES (v_tenant_id, 'Owner') RETURNING id INTO v_sys_owner_role_id;
             RAISE NOTICE 'Created System Role: Owner (%)', v_sys_owner_role_id;
         ELSE
             RAISE NOTICE 'Found System Role: Owner (%)', v_sys_owner_role_id;
         END IF;

         -- Create Member Role
         SELECT id INTO v_sys_member_role_id FROM public.roles WHERE tenant_id = v_tenant_id AND name = 'Member';
         IF v_sys_member_role_id IS NULL THEN
             INSERT INTO public.roles (tenant_id, name) VALUES (v_tenant_id, 'Member') RETURNING id INTO v_sys_member_role_id;
             RAISE NOTICE 'Created System Role: Member (%)', v_sys_member_role_id;
         ELSE
             RAISE NOTICE 'Found System Role: Member (%)', v_sys_member_role_id;
         END IF;
    END IF;

    -- 4. Ensure Company Exists
    SELECT id INTO v_company_id FROM public.companies WHERE tenant_id = v_tenant_id AND name = v_org_name;
    
    IF v_company_id IS NULL THEN
        RAISE NOTICE 'Creating Company: %', v_org_name;
        INSERT INTO public.companies (tenant_id, name) 
        VALUES (v_tenant_id, v_org_name) 
        RETURNING id INTO v_company_id;
    END IF;
    RAISE NOTICE 'Using Company ID: %', v_company_id;

    -- 5. Ensure Company Roles Exist
    -- Owner Role
    SELECT id INTO v_owner_role_id FROM public.company_roles WHERE company_id = v_company_id AND name = 'Owner';
    IF v_owner_role_id IS NULL THEN
        INSERT INTO public.company_roles (tenant_id, company_id, name) 
        VALUES (v_tenant_id, v_company_id, 'Owner') 
        RETURNING id INTO v_owner_role_id;
        RAISE NOTICE 'Created Company Role: Owner';
    ELSE
        RAISE NOTICE 'Found Company Role: Owner';
    END IF;
    
    -- Member Role
    SELECT id INTO v_member_role_id FROM public.company_roles WHERE company_id = v_company_id AND name = 'Member';
    IF v_member_role_id IS NULL THEN
        INSERT INTO public.company_roles (tenant_id, company_id, name) 
        VALUES (v_tenant_id, v_company_id, 'Member') 
        RETURNING id INTO v_member_role_id;
        RAISE NOTICE 'Created Company Role: Member';
    ELSE
        RAISE NOTICE 'Found Company Role: Member';
    END IF;

    -- 6. Fix Tenant Users (Dynamic Insert based on schema)
    IF v_admin_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.tenant_users WHERE tenant_id = v_tenant_id AND user_id = v_admin_id) THEN
            -- Check for role_id column
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_users' AND column_name = 'role_id') THEN
                 EXECUTE 'INSERT INTO public.tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)'
                 USING v_tenant_id, v_admin_id, v_sys_owner_role_id;
                 RAISE NOTICE 'Added Admin to tenant_users (with role)';
            ELSE
                 INSERT INTO public.tenant_users (tenant_id, user_id) VALUES (v_tenant_id, v_admin_id);
                 RAISE NOTICE 'Added Admin to tenant_users (no role)';
            END IF;
        ELSE
            RAISE NOTICE 'Admin already in tenant_users';
        END IF;
    END IF;
    
    IF v_member_id IS NOT NULL THEN
         IF NOT EXISTS (SELECT 1 FROM public.tenant_users WHERE tenant_id = v_tenant_id AND user_id = v_member_id) THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_users' AND column_name = 'role_id') THEN
                 EXECUTE 'INSERT INTO public.tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)'
                 USING v_tenant_id, v_member_id, v_sys_member_role_id;
                 RAISE NOTICE 'Added Member to tenant_users (with role)';
            ELSE
                 INSERT INTO public.tenant_users (tenant_id, user_id) VALUES (v_tenant_id, v_member_id);
                 RAISE NOTICE 'Added Member to tenant_users (no role)';
            END IF;
         ELSE
             RAISE NOTICE 'Member already in tenant_users';
         END IF;
    END IF;

    -- 7. Fix Company Users
    IF v_admin_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.company_users WHERE company_id = v_company_id AND user_id = v_admin_id) THEN
            UPDATE public.company_users 
            SET role_id = v_owner_role_id, tenant_id = v_tenant_id 
            WHERE company_id = v_company_id AND user_id = v_admin_id;
            RAISE NOTICE 'Updated Admin Company Role to Owner';
        ELSE
            INSERT INTO public.company_users (company_id, user_id, tenant_id, role_id) 
            VALUES (v_company_id, v_admin_id, v_tenant_id, v_owner_role_id);
            RAISE NOTICE 'Assigned Owner Company Role to Admin';
        END IF;
    END IF;

    IF v_member_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.company_users WHERE company_id = v_company_id AND user_id = v_member_id) THEN
            UPDATE public.company_users 
            SET role_id = v_member_role_id, tenant_id = v_tenant_id 
            WHERE company_id = v_company_id AND user_id = v_member_id;
            RAISE NOTICE 'Updated Member Company Role to Member';
        ELSE
            INSERT INTO public.company_users (company_id, user_id, tenant_id, role_id) 
            VALUES (v_company_id, v_member_id, v_tenant_id, v_member_role_id);
            RAISE NOTICE 'Assigned Member Company Role to Member';
        END IF;
    END IF;
    
    RAISE NOTICE '=== REMEDIATION COMPLETE (v3) ===';
END $$;
