
-- Migration: 20260218140000_phase4_5_schema.sql
-- Description: Create tables for Missing Apps using mnt_ prefix to match existing schema

-- 1. Ferry Planning: Schedule Templates
CREATE TABLE IF NOT EXISTS public.mnt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mnt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.mnt_templates USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- 2. Ferry Pricing: Price Profiles
CREATE TABLE IF NOT EXISTS public.mnt_price_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_price_adult NUMERIC(10,2) NOT NULL DEFAULT 0,
    base_price_child NUMERIC(10,2) NOT NULL DEFAULT 0,
    base_price_vehicle NUMERIC(10,2) NOT NULL DEFAULT 0,
    base_price_bike NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mnt_price_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.mnt_price_profiles USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- 3. CRM: Partners
CREATE TABLE IF NOT EXISTS public.mnt_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    commission_rate NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mnt_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.mnt_partners USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- 4. Ferry Booking: Services (Fleet Services)
CREATE TABLE IF NOT EXISTS public.mnt_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mnt_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.mnt_services USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- 5. Grants (Strict)
REVOKE ALL ON public.mnt_templates FROM public, anon;
REVOKE ALL ON public.mnt_price_profiles FROM public, anon;
REVOKE ALL ON public.mnt_partners FROM public, anon;
REVOKE ALL ON public.mnt_services FROM public, anon;

GRANT ALL ON public.mnt_templates TO service_role;
GRANT ALL ON public.mnt_price_profiles TO service_role;
GRANT ALL ON public.mnt_partners TO service_role;
GRANT ALL ON public.mnt_services TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mnt_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mnt_price_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mnt_partners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mnt_services TO authenticated;
