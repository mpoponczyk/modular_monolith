
-- 20260217000002_section_editor_rpcs.sql
-- Strict Section Editor RPCs (Admin Only)

-- 1. UPDATE ORGANIZATION SECTION (With Translation Merging & Validation)
CREATE OR REPLACE FUNCTION public.update_organization_section(
    p_tenant_id UUID,
    p_org_id UUID,
    p_section_id UUID,
    p_translations JSONB,
    p_is_partial BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_lang TEXT;
    v_name TEXT;
    v_default_lang TEXT;
    v_has_default BOOLEAN := FALSE;
BEGIN
    -- Auth Guard (Strict Owner)
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations org 
        WHERE org.id = p_org_id 
        AND org.tenant_id = p_tenant_id 
        AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Verify Section Ownership
    IF NOT EXISTS (SELECT 1 FROM public.organization_sections WHERE id = p_section_id AND organization_id = p_org_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Invalid Section';
    END IF;

    -- Get Default Language Code
    SELECT language_code INTO v_default_lang FROM public.organization_languages 
    WHERE organization_id = p_org_id AND tenant_id = p_tenant_id AND is_default = TRUE;

    IF v_default_lang IS NULL THEN
        RAISE EXCEPTION 'Configuration Error: No default language found for organization.';
    END IF;

    -- Update Logic
    IF p_is_partial = FALSE THEN
        -- Full Replacement: Delete existing translations not in input? 
        -- Or just delete all for this section and re-insert.
        DELETE FROM public.organization_section_translations WHERE section_id = p_section_id;
    END IF;

    -- Loop Input
    FOR v_lang, v_name IN SELECT key, value FROM jsonb_each_text(p_translations)
    LOOP
        -- reject unknown language
        IF NOT EXISTS (SELECT 1 FROM public.organization_languages WHERE organization_id = p_org_id AND tenant_id = p_tenant_id AND language_code = v_lang) THEN
             RAISE EXCEPTION 'Invalid Language Code: %', v_lang;
        END IF;

        IF v_name IS NULL OR length(trim(v_name)) = 0 THEN
             -- If default language, fail
             IF v_lang = v_default_lang THEN
                 RAISE EXCEPTION 'Default language translation cannot be empty.';
             END IF;
             -- Skip empty for others? Or delete? Strict: Upsert empty string if provided?
             -- Let's upsert.
        END IF;
        
        -- Upsert
        INSERT INTO public.organization_section_translations (section_id, language_code, tenant_id, organization_id, name)
        VALUES (p_section_id, v_lang, p_tenant_id, p_org_id, v_name)
        ON CONFLICT (section_id, language_code) DO UPDATE SET name = EXCLUDED.name;

        IF v_lang = v_default_lang THEN
            v_has_default := TRUE;
        END IF;
    END LOOP;

    -- Final Check: Default Language Constraint via Query
    IF NOT v_has_default AND NOT EXISTS (SELECT 1 FROM public.organization_section_translations WHERE section_id = p_section_id AND language_code = v_default_lang) THEN
         RAISE EXCEPTION 'Validation Error: Section must have a translation in the default language.';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_organization_section(UUID, UUID, UUID, JSONB, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_organization_section(UUID, UUID, UUID, JSONB, BOOLEAN) TO authenticated;


-- 2. DELETE ORGANIZATION SECTION (Strict Cascade)
CREATE OR REPLACE FUNCTION public.delete_organization_section(
    p_tenant_id UUID,
    p_org_id UUID,
    p_section_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Auth Guard (Strict Owner)
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations org 
        WHERE org.id = p_org_id 
        AND org.tenant_id = p_tenant_id 
        AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Strict Scope Delete
    DELETE FROM public.organization_sections 
    WHERE id = p_section_id 
    AND organization_id = p_org_id 
    AND tenant_id = p_tenant_id;
    
    -- Translations and Items cascade via FK
END;
$$;

REVOKE ALL ON FUNCTION public.delete_organization_section(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_organization_section(UUID, UUID, UUID) TO authenticated;


-- 3. UNLINK SECTION ITEM (Strict PK Delete)
CREATE OR REPLACE FUNCTION public.unlink_section_item(
    p_tenant_id UUID,
    p_org_id UUID,
    p_item_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Auth Guard (Strict Owner)
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations org 
        WHERE org.id = p_org_id 
        AND org.tenant_id = p_tenant_id 
        AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Strict Scope Delete
    DELETE FROM public.organization_section_items
    WHERE id = p_item_id
    AND organization_id = p_org_id
    AND tenant_id = p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.unlink_section_item(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlink_section_item(UUID, UUID, UUID) TO authenticated;


-- 4. REORDER SECTIONS (Dense Integer)
CREATE OR REPLACE FUNCTION public.reorder_sections(
    p_tenant_id UUID,
    p_org_id UUID,
    p_section_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_id UUID;
    v_idx INTEGER;
BEGIN
    -- Auth Guard
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations org 
        WHERE org.id = p_org_id 
        AND org.tenant_id = p_tenant_id 
        AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Validate IDs belong to Org (Batch Check)
    IF EXISTS (
        SELECT 1 FROM unnest(p_section_ids) AS sid
        LEFT JOIN public.organization_sections osc ON osc.id = sid AND osc.organization_id = p_org_id AND osc.tenant_id = p_tenant_id
        WHERE osc.id IS NULL
    ) THEN
         RAISE EXCEPTION 'Invalid Section ID in reorder list (Scope Mismatch)';
    END IF;

    -- Apply Dense Order
    v_idx := 1;
    FOREACH v_id IN ARRAY p_section_ids
    LOOP
        UPDATE public.organization_sections
        SET order_index = v_idx
        WHERE id = v_id;
        v_idx := v_idx + 1;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_sections(UUID, UUID, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_sections(UUID, UUID, UUID[]) TO authenticated;


-- 5. REORDER ITEMS (Dense Integer)
CREATE OR REPLACE FUNCTION public.reorder_section_items(
    p_tenant_id UUID,
    p_org_id UUID,
    p_section_id UUID,
    p_item_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_id UUID;
    v_idx INTEGER;
BEGIN
    -- Auth Guard
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations org 
        WHERE org.id = p_org_id 
        AND org.tenant_id = p_tenant_id 
        AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Validate IDs belong to Section (Batch Check)
    IF EXISTS (
        SELECT 1 FROM unnest(p_item_ids) AS iid
        LEFT JOIN public.organization_section_items osi ON osi.id = iid AND osi.section_id = p_section_id AND osi.organization_id = p_org_id AND osi.tenant_id = p_tenant_id
        WHERE osi.id IS NULL
    ) THEN
         RAISE EXCEPTION 'Invalid Item ID in reorder list (Scope Mismatch)';
    END IF;

    -- Apply Dense Order
    v_idx := 1;
    FOREACH v_id IN ARRAY p_item_ids
    LOOP
        UPDATE public.organization_section_items
        SET order_index = v_idx
        WHERE id = v_id;
        v_idx := v_idx + 1;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_section_items(UUID, UUID, UUID, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_section_items(UUID, UUID, UUID, UUID[]) TO authenticated;
