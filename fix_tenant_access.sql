
-- 1. Enable RLS on tenant_modules (if not already)
ALTER TABLE "public"."tenant_modules" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to avoid conflicts (safe way: create if not exists or drop then create)
DROP POLICY IF EXISTS "Users can view modules for their tenants" ON "public"."tenant_modules";

-- 3. Create RLS Policy for tenant_modules
CREATE POLICY "Users can view modules for their tenants"
ON "public"."tenant_modules"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "public"."tenant_users"
    WHERE "tenant_users"."tenant_id" = "tenant_modules"."tenant_id"
    AND "tenant_users"."user_id" = auth.uid()
  )
);

-- 4. Update RPC to be robust (DISTINCT, ACTIVE only)
DROP FUNCTION IF EXISTS resolve_user_tenants();

CREATE OR REPLACE FUNCTION resolve_user_tenants()
RETURNS TABLE (
  tenant_id uuid,
  name text,
  slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.id, t.name, t.slug
  FROM public.tenants t
  JOIN public.tenant_users tu ON t.id = tu.tenant_id
  WHERE tu.user_id = auth.uid()
  AND t.status = 'active';
END;
$$;
