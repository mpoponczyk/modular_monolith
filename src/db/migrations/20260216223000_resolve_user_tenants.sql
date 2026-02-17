-- Secure RPC for Tenant Resolution during Login
-- This allows the Login Page to fetch the user's tenants without exposing the raw tenant_users table to the client.

CREATE OR REPLACE FUNCTION public.resolve_user_tenants()
RETURNS TABLE (
  tenant_id uuid,
  slug text,
  name text,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tenant_id,
    t.slug,
    t.name,
    t.status
  FROM public.tenants t
  JOIN public.tenant_users tu ON t.id = tu.tenant_id
  WHERE tu.user_id = auth.uid()
  AND t.status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_user_tenants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_user_tenants() TO authenticated;
