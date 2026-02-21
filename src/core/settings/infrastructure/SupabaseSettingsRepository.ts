
import { createAuthClient } from "@/infra/supabase/server-auth";
import { ISettingsRepository, SystemSettings, UpdateSettingsDTO } from "../domain/ports";

export class SupabaseSettingsRepository implements ISettingsRepository {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    private get supabase() {
        return this.client || createAuthClient();
    }

    async findByTenant(tenantId: string): Promise<SystemSettings | null> {
        // Phase 3: Dual Read / Switch to RPC
        const { data, error } = await this.supabase.rpc('get_tenant_settings', {
            p_tenant_id: tenantId
        });

        if (error) throw error;
        if (!data) {
            // Should not happen due to RPC logic returning defaults or legacy
            return null;
        }

        return this.mapToDomain(data);
    }

    async initialize(tenantId: string): Promise<SystemSettings> {
        // In Strict Mode, initialization happens via RPC or defaults are returned.
        // We can just return the current state which forces defaults if missing.
        const existing = await this.findByTenant(tenantId);
        if (existing) return existing;

        // If for some reason null (RPC error?), fallback to default object
        return {
            id: tenantId, // Use tenantId as ID
            tenantId: tenantId,
            theme: 'light',
            dateFormat: 'DD/MM/YYYY',
            currency: 'USD',
            emailSenderName: 'System',
            emailSenderAddress: '',
            supportPhone: '',
            updatedAt: new Date().toISOString()
        };
    }

    async update(tenantId: string, settings: UpdateSettingsDTO): Promise<void> {
        // Fetch current to merge (since RPC takes all args)
        // Or better, just pass what we have, relying on RPC to handle partial updates?
        // The RPC 'update_tenant_settings' expects ALL params. 
        // We need to fetch current state first or update RPC to handle nulls? 
        // The RPC implementation uses ON CONFLICT DO UPDATE SET ... = EXCLUDED ...
        // So we must provide all values.

        const current = await this.findByTenant(tenantId);
        if (!current) throw new Error("Settings not found");

        const next = { ...current, ...settings };

        const { error } = await this.supabase.rpc('update_tenant_settings', {
            p_tenant_id: tenantId,
            p_portal_name: 'My Portal', // Legacy doesn't have this, default
            p_branding_json: {}, // Legacy doesn't have this
            p_locale: 'en', // Legacy default
            p_theme: next.theme || 'light',
            p_date_format: next.dateFormat || 'DD/MM/YYYY',
            p_currency: next.currency || 'USD',
            p_support_email: next.emailSenderAddress || '',
            p_support_phone: next.supportPhone || '',
            p_timezone: 'UTC',
            p_brand_color: '#000000',
            p_logo_url: null,
            p_feature_flags: {}
        });

        if (error) throw error;
    }

    private mapToDomain(raw: any): SystemSettings {
        // RPC returns snake_case JSONB structure
        return {
            id: raw.tenant_id, // Map tenant_id to id for legacy compatibility
            tenantId: raw.tenant_id,
            theme: raw.theme || 'light',
            dateFormat: raw.date_format || 'DD/MM/YYYY',
            currency: raw.currency || 'USD',
            emailSenderName: 'System', // Not persisted in new schema yet? Or mapped? RPC doesn't have sender_name
            emailSenderAddress: raw.support_email || '',
            supportPhone: raw.support_phone || '',
            updatedAt: raw.updated_at || new Date().toISOString()
        };
    }
}
