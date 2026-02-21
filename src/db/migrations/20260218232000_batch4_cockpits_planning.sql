-- Migration: 20260218232000_batch4_cockpits_planning.sql
-- Description: Cockpits and System Planning Tables

-- 1. Cockpits
CREATE TABLE IF NOT EXISTS public.sys_cockpits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    config_json JSONB DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sys_cockpits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.sys_cockpits USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

REVOKE ALL ON public.sys_cockpits FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sys_cockpits TO authenticated;

-- RPC: get_cockpits
CREATE OR REPLACE FUNCTION public.get_cockpits(p_tenant_id UUID)
RETURNS SETOF public.sys_cockpits
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    IF NOT public.authorize('cockpits.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;
    RETURN QUERY SELECT * FROM public.sys_cockpits WHERE tenant_id = p_tenant_id ORDER BY created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_cockpits(UUID) TO authenticated;

-- RPC: upsert_cockpit
CREATE OR REPLACE FUNCTION public.upsert_cockpit(
    p_tenant_id UUID,
    p_id UUID,
    p_name TEXT,
    p_config_json JSONB
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT public.authorize('cockpits.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    INSERT INTO public.sys_cockpits (id, tenant_id, name, config_json, updated_at)
    VALUES (COALESCE(p_id, gen_random_uuid()), p_tenant_id, p_name, p_config_json, now())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        config_json = EXCLUDED.config_json,
        updated_at = now()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_cockpit(UUID, UUID, TEXT, JSONB) TO authenticated;

-- 2. System Planning (Announcements/Maintenance)
CREATE TABLE IF NOT EXISTS public.sys_planning_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('maintenance', 'announcement', 'holiday')),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sys_planning_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.sys_planning_items USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

REVOKE ALL ON public.sys_planning_items FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sys_planning_items TO authenticated;

-- RPC: get_planning_items
CREATE OR REPLACE FUNCTION public.get_planning_items(p_tenant_id UUID)
RETURNS SETOF public.sys_planning_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    IF NOT public.authorize('planning.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;
    RETURN QUERY SELECT * FROM public.sys_planning_items 
    WHERE tenant_id = p_tenant_id 
    ORDER BY start_at ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_planning_items(UUID) TO authenticated;
