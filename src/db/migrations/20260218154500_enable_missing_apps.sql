
-- Migration: 20260218154500_enable_missing_apps.sql
-- Description: Enable missing Phase 4 & 5 apps for test-tenant

DO $$
DECLARE
    v_tenant_id UUID;
    v_org_id UUID;
BEGIN
    -- Get IDs for test-tenant
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'test-tenant';
    SELECT id INTO v_org_id FROM public.organizations WHERE tenant_id = v_tenant_id LIMIT 1;

    IF v_tenant_id IS NOT NULL AND v_org_id IS NOT NULL THEN
        -- Insert Apps
        INSERT INTO public.organization_apps (tenant_id, organization_id, module_id, is_active)
        VALUES 
            (v_tenant_id, v_org_id, 'ferry-planning', true),
            (v_tenant_id, v_org_id, 'ferry-reporting', true),
            (v_tenant_id, v_org_id, 'ferry-booking', true),
            (v_tenant_id, v_org_id, 'crm', true),
            (v_tenant_id, v_org_id, 'ferry-pricing', true),
            (v_tenant_id, v_org_id, 'users', true),
            (v_tenant_id, v_org_id, 'roles', true),
            (v_tenant_id, v_org_id, 'settings', true)
        ON CONFLICT (organization_id, module_id) DO NOTHING;
    END IF;
END $$;
