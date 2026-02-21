
-- Migration: 20260218150000_add_pricing_to_routes.sql
-- Description: Link Routes to Pricing Profiles

ALTER TABLE public.mnt_routes 
ADD COLUMN IF NOT EXISTS default_price_profile_id UUID REFERENCES public.mnt_price_profiles(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_mnt_routes_price_profile ON public.mnt_routes(default_price_profile_id);
