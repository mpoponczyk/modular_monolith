-- 20260218160000_phase6_parity.sql
-- Phase 6: Legacy Parity Population (Strict Helper Mode)
-- Creates a helper function to seed legacy sections and apps for a specific tenant/org.

-- 1. Create Helper Function
CREATE OR REPLACE FUNCTION public.seed_legacy_sections_for_tenant(
    p_tenant_id UUID,
    p_org_id UUID
) RETURNS VOID AS $$
DECLARE
    sec_system UUID;
    sec_ops UUID;
    sec_sales UUID;
    sec_reporting UUID;
    sec_scheduling UUID;
    app_id UUID;
BEGIN
    -- 1.0 Ensure Language 'en' exists
    INSERT INTO public.organization_languages (tenant_id, organization_id, language_code, is_default)
    VALUES (p_tenant_id, p_org_id, 'en', true)
    ON CONFLICT (organization_id, language_code) DO NOTHING;

    -- 1.1 Create/Get "System" Section
    -- Try to find by name first to avoid duplicates if ID not known
    SELECT s.id INTO sec_system FROM public.organization_sections s
    JOIN public.organization_section_translations t ON s.id = t.section_id
    WHERE s.organization_id = p_org_id AND t.language_code = 'en' AND t.name = 'System' LIMIT 1;

    IF sec_system IS NULL THEN
        INSERT INTO public.organization_sections (tenant_id, organization_id, order_index, is_enabled)
        VALUES (p_tenant_id, p_org_id, 90, true) RETURNING id INTO sec_system;
        INSERT INTO public.organization_section_translations (section_id, language_code, tenant_id, organization_id, name)
        VALUES (sec_system, 'en', p_tenant_id, p_org_id, 'System');
    END IF;

    -- 1.2 Create/Get "Operations" Section
    SELECT s.id INTO sec_ops FROM public.organization_sections s
    JOIN public.organization_section_translations t ON s.id = t.section_id
    WHERE s.organization_id = p_org_id AND t.language_code = 'en' AND t.name = 'Operations' LIMIT 1;

    IF sec_ops IS NULL THEN
        INSERT INTO public.organization_sections (tenant_id, organization_id, order_index, is_enabled)
        VALUES (p_tenant_id, p_org_id, 10, true) RETURNING id INTO sec_ops;
        INSERT INTO public.organization_section_translations (section_id, language_code, tenant_id, organization_id, name)
        VALUES (sec_ops, 'en', p_tenant_id, p_org_id, 'Operations');
    END IF;

    -- 1.3 Create/Get "Sales" Section
    SELECT s.id INTO sec_sales FROM public.organization_sections s
    JOIN public.organization_section_translations t ON s.id = t.section_id
    WHERE s.organization_id = p_org_id AND t.language_code = 'en' AND t.name = 'Sales' LIMIT 1;

    IF sec_sales IS NULL THEN
        INSERT INTO public.organization_sections (tenant_id, organization_id, order_index, is_enabled)
        VALUES (p_tenant_id, p_org_id, 30, true) RETURNING id INTO sec_sales;
        INSERT INTO public.organization_section_translations (section_id, language_code, tenant_id, organization_id, name)
        VALUES (sec_sales, 'en', p_tenant_id, p_org_id, 'Sales');
    END IF;

    -- 1.4 Create/Get "Reporting" Section
    SELECT s.id INTO sec_reporting FROM public.organization_sections s
    JOIN public.organization_section_translations t ON s.id = t.section_id
    WHERE s.organization_id = p_org_id AND t.language_code = 'en' AND t.name = 'Reporting' LIMIT 1;

    IF sec_reporting IS NULL THEN
        INSERT INTO public.organization_sections (tenant_id, organization_id, order_index, is_enabled)
        VALUES (p_tenant_id, p_org_id, 60, true) RETURNING id INTO sec_reporting;
        INSERT INTO public.organization_section_translations (section_id, language_code, tenant_id, organization_id, name)
        VALUES (sec_reporting, 'en', p_tenant_id, p_org_id, 'Reporting');
    END IF;

    -- 1.5 Create/Get "Scheduling" Section
    SELECT s.id INTO sec_scheduling FROM public.organization_sections s
    JOIN public.organization_section_translations t ON s.id = t.section_id
    WHERE s.organization_id = p_org_id AND t.language_code = 'en' AND t.name = 'Scheduling' LIMIT 1;

    IF sec_scheduling IS NULL THEN
        INSERT INTO public.organization_sections (tenant_id, organization_id, order_index, is_enabled)
        VALUES (p_tenant_id, p_org_id, 20, true) RETURNING id INTO sec_scheduling;
        INSERT INTO public.organization_section_translations (section_id, language_code, tenant_id, organization_id, name)
        VALUES (sec_scheduling, 'en', p_tenant_id, p_org_id, 'Scheduling');
    END IF;

    -- 2. Populate Apps (Using Internal Helper Logic or Direct Insert)
    
    -- Sub-function logic inline for simplicity/closure in one function
    
    -- System Apps
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_system, 'core-admin/users', 'Users', 10);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_system, 'core-admin/roles', 'Roles', 20);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_system, 'core-admin/sessions', 'Sessions', 30);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_system, 'core-admin/settings', 'Settings', 40);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_system, 'core-admin/cockpits', 'Cockpit Painter', 50);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_system, 'core-admin/planning', 'System Planning', 60);

    -- Operations Apps
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_ops, 'ferry-booking/ferries', 'Ferries', 10);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_ops, 'ferry-booking/routes', 'Routes', 20);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_ops, 'ferry-booking/services', 'Services', 30);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_ops, 'ferry-booking/reservations', 'Reservations', 40);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_ops, 'ferry-planning/calendar', 'Calendar', 50);

    -- Sales Apps
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_sales, 'ferry-booking/orders', 'Orders', 10);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_sales, 'ferry-booking/invoices', 'Invoices', 20);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_sales, 'crm/partners', 'Partners', 30);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_sales, 'ferry-pricing/profiles', 'Pricing Profiles', 40);

    -- Reporting Apps
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_reporting, 'ferry-reporting/manifests', 'Manifests', 10);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_reporting, 'ferry-reporting/sales', 'Sales Analytics', 20);

    -- Scheduling Apps
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_scheduling, 'ferry-planning/gantt', 'Gantt', 10);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_scheduling, 'ferry-planning/templates', 'Templates', 20);
    PERFORM public.seed_legacy_app_link(p_tenant_id, p_org_id, sec_scheduling, 'ferry-booking/trips', 'Trips Schedule', 30);

END;
$$ LANGUAGE plpgsql;

-- 2. Create Sub-Helper for App Linking
CREATE OR REPLACE FUNCTION public.seed_legacy_app_link(
    p_tenant_id UUID,
    p_org_id UUID,
    p_section_id UUID,
    p_module_id TEXT,
    p_name TEXT,
    p_order INT
) RETURNS VOID AS $$
DECLARE
    v_app_id UUID;
BEGIN
    -- 1. Ensure App Exists
    INSERT INTO public.organization_apps (tenant_id, organization_id, module_id, is_active)
    VALUES (p_tenant_id, p_org_id, p_module_id, true)
    ON CONFLICT (organization_id, module_id) DO UPDATE SET is_active = true
    RETURNING id INTO v_app_id;

    -- 2. Ensure Translation Exists
    INSERT INTO public.organization_app_translations (organization_app_id, language_code, tenant_id, organization_id, short_name)
    VALUES (v_app_id, 'en', p_tenant_id, p_org_id, p_name)
    ON CONFLICT (organization_app_id, language_code) DO UPDATE SET short_name = p_name;

    -- 3. Ensure Link Exists
    INSERT INTO public.organization_section_items (tenant_id, organization_id, section_id, organization_app_id, order_index, is_enabled)
    VALUES (p_tenant_id, p_org_id, p_section_id, v_app_id, p_order, true)
    ON CONFLICT (section_id, organization_app_id) DO UPDATE SET order_index = p_order;
END;
$$ LANGUAGE plpgsql;

-- 3. Execution Block (Iterate all Organizations)
DO $$
DECLARE
    org RECORD;
BEGIN
    FOR org IN SELECT id, tenant_id FROM public.organizations LOOP
        PERFORM public.seed_legacy_sections_for_tenant(org.tenant_id, org.id);
    END LOOP;
END $$;
