-- Migration: 20260218231000_batch4_invoices.sql
-- Description: Invoices Table (Parity)

-- 1. Table: mnt_invoices
CREATE TABLE IF NOT EXISTS public.mnt_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'issued', -- issued, paid, cancelled
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mnt_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.mnt_invoices USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- 2. Grants
REVOKE ALL ON public.mnt_invoices FROM public, anon;
GRANT SELECT, INSERT, UPDATE ON public.mnt_invoices TO authenticated;

-- 3. RPC: get_invoices
CREATE OR REPLACE FUNCTION public.get_invoices(p_tenant_id UUID)
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    customer_name TEXT,
    total_amount NUMERIC,
    status TEXT,
    issue_date DATE
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth
AS $$
BEGIN
    IF NOT public.authorize('invoices.view', p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        i.id, i.invoice_number, i.customer_name, i.total_amount, i.status, i.issue_date
    FROM public.mnt_invoices i
    WHERE i.tenant_id = p_tenant_id
    ORDER BY i.issue_date DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.get_invoices(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_invoices(UUID) TO authenticated;
