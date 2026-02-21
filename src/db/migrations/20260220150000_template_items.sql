BEGIN;

CREATE TABLE IF NOT EXISTS public.mnt_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.mnt_templates(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.mnt_routes(id) ON DELETE CASCADE,
    departure_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mnt_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.mnt_template_items USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

REVOKE ALL ON public.mnt_template_items FROM public, anon;
GRANT ALL ON public.mnt_template_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mnt_template_items TO authenticated;

-- Add Template Item RPC
CREATE OR REPLACE FUNCTION public.add_template_item(
    p_tenant_id uuid,
    p_template_id uuid,
    p_route_id uuid,
    p_departure_time time
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_id uuid;
BEGIN
    -- Check Authorization
    IF NOT public.authorize('planning.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing planning.manage permission';
    END IF;

    -- Verify template belongs to tenant
    IF NOT EXISTS (SELECT 1 FROM public.mnt_templates WHERE id = p_template_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Template not found or access denied';
    END IF;

    -- Verify route belongs to tenant
    IF NOT EXISTS (SELECT 1 FROM public.mnt_routes WHERE id = p_route_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Route not found or access denied';
    END IF;

    INSERT INTO public.mnt_template_items (tenant_id, template_id, route_id, departure_time)
    VALUES (p_tenant_id, p_template_id, p_route_id, p_departure_time)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Delete Template Item RPC
CREATE OR REPLACE FUNCTION public.delete_template_item(
    p_tenant_id uuid,
    p_item_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('planning.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing planning.manage permission';
    END IF;

    DELETE FROM public.mnt_template_items
    WHERE id = p_item_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found or access denied';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_template_item(uuid, uuid, uuid, time) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_template_item(uuid, uuid) TO authenticated;

COMMIT;
