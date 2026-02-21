-- Migration: 20260219030000_strict_settings_consolidation_phase4_data.sql
-- Description: Phase 4 Data Migration (Copy sys_settings to tenant_settings)

DO $$
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    FOR r IN SELECT * FROM public.sys_settings LOOP
        INSERT INTO public.tenant_settings (
            tenant_id,
            theme,
            date_format,
            currency,
            support_email,
            support_phone,
            updated_at
        ) VALUES (
            r.tenant_id,
            COALESCE(r.theme, 'light'),
            COALESCE(r.date_format, 'DD/MM/YYYY'),
            COALESCE(r.currency, 'USD'),
            r.email_sender_address,
            r.support_phone,
            now()
        )
        ON CONFLICT (tenant_id) DO UPDATE SET
            theme = EXCLUDED.theme,
            date_format = EXCLUDED.date_format,
            currency = EXCLUDED.currency,
            support_email = EXCLUDED.support_email,
            support_phone = EXCLUDED.support_phone,
            updated_at = now();
            
        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Migrated % rows from sys_settings to tenant_settings', v_count;
END $$;
