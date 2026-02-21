
export interface TenantSettings {
    tenant_id: string;
    portal_name: string;
    branding_json: BrandingConfig;
    locale: string;
    email_enabled?: boolean;
    default_timezone?: string;
    heatmap_config?: any;
    updated_at?: string;
}

export interface BrandingConfig {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
}

export interface SettingsRepository {
    getSettings(tenantId: string): Promise<TenantSettings>;
    updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<void>;
}
