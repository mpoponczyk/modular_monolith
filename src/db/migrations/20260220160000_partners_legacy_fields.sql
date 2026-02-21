-- Migration: 20260220160000_partners_legacy_fields.sql
-- Description: Add missing legacy fields to mnt_partners and update RPCs

-- 1. Add new columns
ALTER TABLE public.mnt_partners 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('SELLER', 'BUYER', 'BOTH')) DEFAULT 'SELLER',
ADD COLUMN IF NOT EXISTS nip TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Update create_partner RPC
CREATE OR REPLACE FUNCTION public.create_partner(
    p_tenant_id UUID,
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_commission_rate NUMERIC DEFAULT 0,
    p_is_active BOOLEAN DEFAULT true,
    p_type TEXT DEFAULT 'SELLER',
    p_nip TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_postal_code TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_partner_id UUID;
BEGIN
    INSERT INTO public.mnt_partners (
        tenant_id, name, email, phone, commission_rate, is_active,
        type, nip, address, postal_code, city
    )
    VALUES (
        p_tenant_id, p_name, p_email, p_phone, p_commission_rate, p_is_active,
        p_type, p_nip, p_address, p_postal_code, p_city
    )
    RETURNING id INTO v_partner_id;

    RETURN v_partner_id;
END;
$$;

-- 3. Update update_partner RPC
CREATE OR REPLACE FUNCTION public.update_partner(
    p_tenant_id UUID,
    p_partner_id UUID,
    p_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_commission_rate NUMERIC DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_nip TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_postal_code TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    UPDATE public.mnt_partners
    SET 
        name = COALESCE(p_name, name),
        email = COALESCE(p_email, email),
        phone = COALESCE(p_phone, phone),
        commission_rate = COALESCE(p_commission_rate, commission_rate),
        is_active = COALESCE(p_is_active, is_active),
        type = COALESCE(p_type, type),
        nip = COALESCE(p_nip, nip),
        address = COALESCE(p_address, address),
        postal_code = COALESCE(p_postal_code, postal_code),
        city = COALESCE(p_city, city),
        updated_at = now()
    WHERE id = p_partner_id AND tenant_id = p_tenant_id;
END;
$$;
