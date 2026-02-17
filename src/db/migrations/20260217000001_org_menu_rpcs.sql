-- 20260217000001_org_menu_rpcs.sql
-- Strict Organization Menu & Variants System - RPCs
-- Context: Tenant > Organization > Section > App

-- =================================================================================================
-- HELPER: Resolve Language
-- =================================================================================================

CREATE OR REPLACE FUNCTION public.resolve_org_language(
    p_tenant_id UUID,
    p_org_id UUID,
    p_requested_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_resolved_code TEXT;
BEGIN
    -- 1. Try Requested
    SELECT language_code INTO v_resolved_code
    FROM public.organization_languages
    WHERE tenant_id = p_tenant_id
      AND organization_id = p_org_id
      AND language_code = p_requested_code;

    IF v_resolved_code IS NOT NULL THEN
        RETURN v_resolved_code;
    END IF;

    -- 2. Try Default
    SELECT language_code INTO v_resolved_code
    FROM public.organization_languages
    WHERE tenant_id = p_tenant_id
      AND organization_id = p_org_id
      AND is_default = TRUE;

    RETURN v_resolved_code; -- Can be NULL (Fail-Closed at caller)
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_org_language(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_org_language(UUID, UUID, TEXT) TO authenticated;


-- =================================================================================================
-- CORE RPC: Resolve Menu Structure
-- Strict 7-Step Pipeline
-- =================================================================================================

CREATE OR REPLACE FUNCTION public.resolve_menu_structure(
    p_tenant_id UUID,
    p_org_id UUID,
    p_language_code TEXT,
    p_active_variant_id UUID DEFAULT NULL -- Session Override
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_final_lang TEXT;
    v_variant_id UUID;
    v_result JSONB;
BEGIN
    -- 0. Security Guard (Membership & Scope)
    -- Validate Tenant/Org scope strictly
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations 
        WHERE id = p_org_id AND tenant_id = p_tenant_id
    ) THEN
        RETURN '[]'::JSONB; -- Fail-Closed (Invalid Scope)
    END IF;

    -- Using the standard membership pattern (Company Member OR Owner Group)
    IF NOT EXISTS (
        SELECT 1 FROM public.company_users cu 
        JOIN public.org_companies oc ON cu.company_id = oc.company_id 
        WHERE oc.organization_id = p_org_id AND cu.user_id = v_user_id
    ) AND NOT EXISTS (
        SELECT 1 FROM public.organizations org 
        WHERE org.id = p_org_id 
        AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = v_user_id)
    ) THEN
        RETURN '[]'::JSONB; -- Fail-Closed (Empty)
    END IF;

    -- 1. Language Resolution
    v_final_lang := public.resolve_org_language(p_tenant_id, p_org_id, p_language_code);
    IF v_final_lang IS NULL THEN
        -- No default language defined implies configuration error
        RETURN '[]'::JSONB;
    END IF;

    -- 2. Variant Selection Phase (Step 5 in Spec)
    -- Priority: Session > User Pref > Global Default > Base (NULL)
    IF p_active_variant_id IS NOT NULL THEN
        v_variant_id := p_active_variant_id;
        -- Validate variant ownership/scope/TENANT
        IF NOT EXISTS (
            SELECT 1 FROM public.organization_menu_variants v
            WHERE v.id = v_variant_id 
            AND v.organization_id = p_org_id
            AND v.tenant_id = p_tenant_id
            AND (v.is_global = TRUE OR v.owner_user_id = v_user_id)
        ) THEN
            v_variant_id := NULL; -- Invalid variant, fall back
        END IF;
    END IF;

    IF v_variant_id IS NULL THEN
        SELECT variant_id INTO v_variant_id
        FROM public.user_variant_preferences
        WHERE user_id = v_user_id AND organization_id = p_org_id AND tenant_id = p_tenant_id;
    END IF;

    IF v_variant_id IS NULL THEN
        SELECT id INTO v_variant_id
        FROM public.organization_menu_variants
        WHERE organization_id = p_org_id AND tenant_id = p_tenant_id AND is_global = TRUE AND is_default = TRUE
        LIMIT 1;
    END IF;

    -- 3. Pipeline Execution (CTEs)
    WITH 
    -- Step 1: System Block
    blocked_modules AS (
        SELECT module_id 
        FROM public.organization_module_overrides
        WHERE organization_id = p_org_id AND is_blocked = TRUE
    ),
    -- Step 2: Activation (and implicitly DB-based RBAC if we had it)
    -- STRICT SPEC: Client-injected RBAC is FORBIDDEN.
    -- PHASE 1: All active apps are visible to organization members.
    -- FUTURE: Join internal `auth.permissions` table here to filter by required_permission.
    active_apps AS (
        SELECT oa.id AS app_uid, oa.module_id
        FROM public.organization_apps oa
        WHERE oa.organization_id = p_org_id
          AND oa.is_active = TRUE
          AND oa.module_id NOT IN (SELECT module_id FROM blocked_modules)
    ),
    -- Step 3: Base Structure
    base_structure AS (
        SELECT 
            s.id AS section_id,
            s.order_index AS section_base_order,
            st.name AS section_name,
            aa.app_uid,
            aa.module_id,
            osi.order_index AS item_base_order,
            at.short_name AS app_name,
            at.short_description AS app_desc,
            at.long_description AS app_long_desc
        FROM public.organization_sections s
        JOIN public.organization_section_items osi ON s.id = osi.section_id
        JOIN active_apps aa ON osi.organization_app_id = aa.app_uid
        LEFT JOIN public.organization_section_translations st 
            ON s.id = st.section_id AND st.language_code = v_final_lang
        LEFT JOIN public.organization_app_translations at 
            ON aa.app_uid = at.organization_app_id AND at.language_code = v_final_lang
        WHERE s.organization_id = p_org_id 
          AND s.is_enabled = TRUE
          AND osi.is_enabled = TRUE
    ),
    -- Step 6: Variant Overlay
    variant_overlay AS (
        SELECT 
            bs.*,
            -- Apply Variant Overrides
            COALESCE(vi.is_hidden, FALSE) AS is_hidden,
            -- App/Item Ordering
            COALESCE(vi.order_index, bs.item_base_order) AS final_item_order
            -- STRICT SPEC OPTION A: Section Reordering is NOT supported in this implementation.
            -- Variants only overlay App visibility and App order within Sections.
            -- Sections ALWAYS strictly follow Base Structure order (organization_sections.order_index).
        FROM base_structure bs
        LEFT JOIN public.organization_menu_variant_items vi
            ON vi.variant_id = v_variant_id
            AND vi.section_id = bs.section_id
            AND vi.organization_app_id = bs.app_uid
    ),
    -- Step 7: Pruning (and final assembly)
    visible_items AS (
        SELECT * FROM variant_overlay
        WHERE is_hidden = FALSE
    ),
    aggregated_sections AS (
        SELECT 
            section_id,
            MIN(section_name) as title,
            MIN(section_base_order) as base_order, 
            jsonb_agg(
                jsonb_build_object(
                    'app_id', app_uid,
                    'module_id', module_id,
                    'title', app_name, -- Can be NULL
                    'description', app_desc,
                    'order', final_item_order
                ) ORDER BY final_item_order ASC
            ) as apps
        FROM visible_items
        GROUP BY section_id
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', section_id,
            'title', title, -- Can be NULL (Strict Spec: UI handles fallback)
            'apps', apps,
            'base_order', base_order -- Debug/Traceability
        ) ORDER BY base_order ASC -- STRICT: Sections use Base Order only
    ) INTO v_result
    FROM aggregated_sections;

    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_menu_structure(UUID, UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_menu_structure(UUID, UUID, TEXT, UUID) TO authenticated;


-- =================================================================================================
-- WRITE RPCS (Admins Only)
-- =================================================================================================

-- 1. Create Section (No Hardcoded Languages)
CREATE OR REPLACE FUNCTION public.create_organization_section(
    p_tenant_id UUID,
    p_org_id UUID,
    p_translations JSONB, -- Key: language_code, Value: name
    p_order_index INTEGER DEFAULT 999
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_section_id UUID;
    v_lang TEXT;
    v_name TEXT;
BEGIN
    -- Auth Guard
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations org 
        WHERE org.id = p_org_id 
        AND org.tenant_id = p_tenant_id -- Scope Guard
        AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only Organization Owners can manage structure.';
    END IF;

    -- Create Section
    INSERT INTO public.organization_sections (tenant_id, organization_id, order_index)
    VALUES (p_tenant_id, p_org_id, p_order_index)
    RETURNING id INTO v_section_id;

    -- Iterate Keys in JSONB
    FOR v_lang, v_name IN SELECT key, value FROM jsonb_each_text(p_translations)
    LOOP
        -- Verify Language Exists in Org
        IF EXISTS (SELECT 1 FROM public.organization_languages WHERE organization_id = p_org_id AND tenant_id = p_tenant_id AND language_code = v_lang) THEN
            INSERT INTO public.organization_section_translations (section_id, language_code, tenant_id, organization_id, name)
            VALUES (v_section_id, v_lang, p_tenant_id, p_org_id, v_name)
            ON CONFLICT (section_id, language_code) DO UPDATE SET name = EXCLUDED.name;
        END IF;
    END LOOP;

    RETURN v_section_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_section(UUID, UUID, JSONB, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_section(UUID, UUID, JSONB, INTEGER) TO authenticated;

-- 2. Link App (Strict A/B Separation)
CREATE OR REPLACE FUNCTION public.link_app_to_section(
    p_tenant_id UUID,
    p_org_id UUID,
    p_section_id UUID,
    p_module_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_app_id UUID;
BEGIN
    -- Auth Guard
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations org 
        WHERE org.id = p_org_id 
        AND org.tenant_id = p_tenant_id -- Scope Guard
        AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Requirement: App MUST exist in B (organization_apps)
    SELECT id INTO v_app_id FROM public.organization_apps 
    WHERE organization_id = p_org_id AND tenant_id = p_tenant_id AND module_id = p_module_id;

    IF v_app_id IS NULL THEN
        RAISE EXCEPTION 'Integration Error: App must be activated in organization_apps before linking.';
    END IF;

    -- Link
    INSERT INTO public.organization_section_items (tenant_id, organization_id, section_id, organization_app_id, order_index)
    VALUES (p_tenant_id, p_org_id, p_section_id, v_app_id, 999)
    ON CONFLICT (section_id, organization_app_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.link_app_to_section(UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_app_to_section(UUID, UUID, UUID, TEXT) TO authenticated;

-- 3. Set User Preference
CREATE OR REPLACE FUNCTION public.set_user_variant_preference(
    p_tenant_id UUID,
    p_org_id UUID,
    p_variant_id UUID -- Can be NULL to reset
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Validate Access to Org
    IF NOT EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id WHERE oc.organization_id = p_org_id AND cu.user_id = auth.uid()) 
       AND NOT EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = p_org_id AND org.tenant_id = p_tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Check Variant Access (if not null)
    IF p_variant_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.organization_menu_variants v
            WHERE v.id = p_variant_id 
            AND v.organization_id = p_org_id
            AND v.tenant_id = p_tenant_id -- Scope Guard
            AND (v.is_global = TRUE OR v.owner_user_id = auth.uid())
        ) THEN
            RAISE EXCEPTION 'Invalid Variant';
        END IF;
    END IF;

    -- Upsert
    INSERT INTO public.user_variant_preferences (tenant_id, organization_id, user_id, variant_id)
    VALUES (p_tenant_id, p_org_id, auth.uid(), p_variant_id)
    ON CONFLICT (user_id, organization_id) 
    DO UPDATE SET variant_id = EXCLUDED.variant_id, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_variant_preference(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_variant_preference(UUID, UUID, UUID) TO authenticated;
