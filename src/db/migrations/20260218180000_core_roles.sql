
-- 20260218180000_core_roles.sql
-- Core Roles & Permissions Schema (Strict)

BEGIN;

-- 1. Ensure Permissions Table
DROP TABLE IF EXISTS public.permissions CASCADE;
CREATE TABLE public.permissions (
    key text PRIMARY KEY,
    description text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;

CREATE POLICY "Permissions viewable by authenticated" ON public.permissions
    FOR SELECT TO authenticated USING (true);

-- 2. Roles Table
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, name)
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;

-- 2. Role Permissions Link Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (role_id, permission_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Roles: Viewable by authenticated members of tenant
CREATE POLICY "Roles viewable by tenant members" ON public.roles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.tenant_id = roles.tenant_id
            AND tu.user_id = auth.uid()
        )
    );

-- Role Permissions: Viewable by tenant members
CREATE POLICY "Role permissions viewable by tenant members" ON public.role_permissions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.tenant_id = role_permissions.tenant_id
            AND tu.user_id = auth.uid()
        )
    );

-- REVOKE writes from public/authenticated (Strict RPC only)
REVOKE INSERT, UPDATE, DELETE ON public.roles FROM public, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.role_permissions FROM public, anon, authenticated;

-- 4. RPCs

-- Create Role
CREATE OR REPLACE FUNCTION public.create_role(p_tenant_id uuid, p_name text, p_description text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
DECLARE
    v_role_id uuid;
BEGIN
    -- Check Authorization (roles.manage)
    IF NOT public.authorize('roles.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing roles.manage permission';
    END IF;

    INSERT INTO public.roles (tenant_id, name, description)
    VALUES (p_tenant_id, p_name, p_description)
    RETURNING id INTO v_role_id;

    RETURN v_role_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_role(uuid, text, text) TO authenticated;

-- Delete Role
CREATE OR REPLACE FUNCTION public.delete_role(p_tenant_id uuid, p_role_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('roles.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing roles.manage permission';
    END IF;

    DELETE FROM public.roles
    WHERE id = p_role_id AND tenant_id = p_tenant_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_role(uuid, uuid) TO authenticated;

-- Assign Permission to Role
CREATE OR REPLACE FUNCTION public.assign_permission_to_role(p_tenant_id uuid, p_role_id uuid, p_permission_key text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('roles.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing roles.manage permission';
    END IF;

    -- Verify Role Belongs to Tenant
    IF NOT EXISTS (SELECT 1 FROM public.roles WHERE id = p_role_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Role not found in tenant';
    END IF;

    INSERT INTO public.role_permissions (role_id, permission_key, tenant_id)
    VALUES (p_role_id, p_permission_key, p_tenant_id)
    ON CONFLICT DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_permission_to_role(uuid, uuid, text) TO authenticated;

-- Revoke Permission from Role
CREATE OR REPLACE FUNCTION public.revoke_permission_from_role(p_tenant_id uuid, p_role_id uuid, p_permission_key text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    -- Check Authorization
    IF NOT public.authorize('roles.manage', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: Missing roles.manage permission';
    END IF;

    DELETE FROM public.role_permissions
    WHERE role_id = p_role_id AND permission_key = p_permission_key AND tenant_id = p_tenant_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.revoke_permission_from_role(uuid, uuid, text) TO authenticated;

COMMIT;
