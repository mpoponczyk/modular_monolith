-- RLS Policies strictly for core-admin/sessions module.

ALTER TABLE public.auth_trusted_devices ENABLE ROW LEVEL SECURITY;

-- Note: The actual queries in monolithic architecture often use service_role and explicit tenant filtering 
-- (`eq('tenant_id', ...)`) but we declare RLS to fail-close if accessed directly.

CREATE POLICY "auth_trusted_devices_tenant_isolation" ON public.auth_trusted_devices
    FOR ALL
    USING (
         exists (
            select 1 from public.admin_profiles
            join public.tenant_users on admin_profiles.id = tenant_users.user_id
            where admin_profiles.id = auth_trusted_devices.user_id
            and tenant_users.tenant_id = (select auth.jwt()->>'app_metadata'->'tenant_id')::uuid
         )
    );
