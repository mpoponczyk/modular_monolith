
-- ==============================================================================
-- FIX RLS RECURSION
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- 1. Create a Helper Function (Security Definer) to break RLS loop
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.tenant_users 
    WHERE tenant_id = _tenant_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Update tenant_modules Policy to use the function
DROP POLICY IF EXISTS "Users can read modules of their tenants" ON public.tenant_modules;

CREATE POLICY "Users can read modules of their tenants"
ON public.tenant_modules
FOR SELECT
TO authenticated
USING (
  public.is_tenant_member(tenant_id)
);

-- 3. Update tenant_users Policy to be non-recursive for OWN row
-- Split into two policies or optimize the existing one?
-- "Users can read members of their tenants" -> Recurses if it checks "Am I a member of the tenant of the row I'm trying to read?"

DROP POLICY IF EXISTS "Users can read members of their tenants" ON public.tenant_users;

-- Policy A: I can see my own row (Base Case)
CREATE POLICY "Users can see own membership"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Policy B: I can see other members if I am a member of that tenant (Uses Function to avoid recursion)
CREATE POLICY "Users can see fellow members"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (
  public.is_tenant_member(tenant_id)
);

-- Verify
-- RAISE NOTICE '✅ RLS Recursion Fixed.';
