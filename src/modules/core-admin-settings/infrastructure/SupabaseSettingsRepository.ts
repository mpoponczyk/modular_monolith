
import { createAuthClient } from '@/infra/supabase/server-auth';
import { SettingsRepository, TenantSettings } from '../domain/types';

export class SupabaseSettingsRepository implements SettingsRepository {
    async getSettings(tenantId: string): Promise<TenantSettings> {
        const supabase = createAuthClient();
        const { data, error } = await supabase.rpc('get_tenant_settings', {
            p_tenant_id: tenantId
        });

        if (error) throw error;

        // Ensure default structure if RPC returns null (though RPC handles it)
        return data as TenantSettings;
    }

    async updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('update_tenant_settings', {
            p_tenant_id: tenantId,
            p_portal_name: settings.portal_name || 'My Portal',
            p_branding_json: settings.branding_json || {},
            p_locale: settings.locale || 'en'
        });

        if (error) throw error;
    }
}
