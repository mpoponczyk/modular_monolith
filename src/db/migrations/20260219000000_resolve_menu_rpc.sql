
-- Migration: resolve_menu_structure_rpc
-- Date: 2026-02-19
-- Description: Trusted RPC to fetch dynamic menu structure, bypassing recursive RLS on company_users via SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.resolve_menu_structure(
    p_tenant_id uuid,
    p_locale text
)
RETURNS TABLE (
    id uuid,
    order_index integer,
    is_enabled boolean,
    name text,
    items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
    -- 1. Explicit Tenant Membership Check (Security Guard)
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE tenant_id = p_tenant_id
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied: User is not a member of this tenant';
    END IF;

    -- 2. Return Menu Structure
    -- Groups items by section and aggregates them into a JSONB array 'items'.
    RETURN QUERY
    SELECT 
        s.id,
        s.order_index,
        s.is_enabled,
        COALESCE(t.name, 'Unknown') as name,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', i.id,
                    'order_index', i.order_index,
                    'is_enabled', i.is_enabled,
                    'module_id', a.module_id,
                    'is_active', a.is_active
                ) ORDER BY i.order_index
            ) FILTER (WHERE i.id IS NOT NULL),
            '[]'::jsonb
        ) as items
    FROM public.organization_sections s
    LEFT JOIN public.organization_section_translations t 
        ON s.id = t.section_id 
        AND t.language_code = p_locale
        AND t.tenant_id = p_tenant_id
    LEFT JOIN public.organization_section_items i 
        ON s.id = i.section_id
        AND i.tenant_id = p_tenant_id
        AND i.is_enabled = true
    LEFT JOIN public.organization_apps a 
        ON i.organization_app_id = a.id
        AND a.tenant_id = p_tenant_id
    WHERE s.tenant_id = p_tenant_id
    AND s.is_enabled = true
    GROUP BY s.id, s.order_index, s.is_enabled, t.name
    ORDER BY s.order_index;
END;
$$;

-- Security Settings
REVOKE ALL ON FUNCTION public.resolve_menu_structure(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_menu_structure(uuid, text) TO authenticated;
