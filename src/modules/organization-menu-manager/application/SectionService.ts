
import { createAuthClient } from '@/infra/supabase/server-auth';

// TYPES (Manual definition, mirrors DB schema)
export interface OrganizationSection {
    id: string;
    tenant_id: string;
    organization_id: string;
    is_enabled: boolean;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface OrganizationSectionTranslation {
    section_id: string;
    language_code: string;
    tenant_id: string;
    organization_id: string;
    name: string;
}

export interface OrganizationSectionItem {
    id: string;
    tenant_id: string;
    organization_id: string;
    section_id: string;
    organization_app_id: string;
    order_index: number;
    is_enabled: boolean;
}

export interface OrganizationApp {
    id: string;
    tenant_id: string;
    organization_id: string;
    module_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface OrganizationLanguage {
    id: string;
    tenant_id: string;
    organization_id: string;
    language_code: string;
    is_default: boolean;
    created_at: string;
}

// SERVICE DEFINITION
export class SectionService {

    // =========================================================================
    // READ OPERATIONS (Direct RLS)
    // =========================================================================

    static async getSections(tenantId: string, orgId: string): Promise<OrganizationSection[]> {
        const supabase = await createAuthClient();
        const { data, error } = await supabase
            .from('organization_sections')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('organization_id', orgId)
            .order('order_index', { ascending: true }); // Base Order

        if (error) throw new Error(`[SectionService] getSections Failed: ${error.message}`);
        return (data as OrganizationSection[]) || [];
    }

    static async getSectionTranslations(tenantId: string, orgId: string): Promise<OrganizationSectionTranslation[]> {
        const supabase = await createAuthClient();
        const { data, error } = await supabase
            .from('organization_section_translations')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('organization_id', orgId);

        if (error) throw new Error(`[SectionService] getSectionTranslations Failed: ${error.message}`);
        return (data as OrganizationSectionTranslation[]) || [];
    }

    static async getSectionItems(tenantId: string, orgId: string): Promise<OrganizationSectionItem[]> {
        const supabase = await createAuthClient();
        const { data, error } = await supabase
            .from('organization_section_items')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('organization_id', orgId)
            .order('order_index', { ascending: true });

        if (error) throw new Error(`[SectionService] getSectionItems Failed: ${error.message}`);
        return (data as OrganizationSectionItem[]) || [];
    }

    static async getOrganizationApps(tenantId: string, orgId: string): Promise<OrganizationApp[]> {
        const supabase = await createAuthClient();
        const { data, error } = await supabase
            .from('organization_apps')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('organization_id', orgId)
            .eq('is_active', true); // Only active apps relevant for linking

        if (error) throw new Error(`[SectionService] getOrganizationApps Failed: ${error.message}`);
        return (data as OrganizationApp[]) || [];
    }

    static async getOrganizationLanguages(tenantId: string, orgId: string): Promise<OrganizationLanguage[]> {
        const supabase = await createAuthClient();
        const { data, error } = await supabase
            .from('organization_languages')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('organization_id', orgId);

        if (error) throw new Error(`[SectionService] getOrganizationLanguages Failed: ${error.message}`);
        return (data as OrganizationLanguage[]) || [];
    }

    // =========================================================================
    // WRITE OPERATIONS (Strict RPCs)
    // =========================================================================

    // Create Section
    static async createSection(
        tenantId: string,
        orgId: string,
        translations: Record<string, string>,
        orderIndex: number = 999
    ): Promise<string> {
        const supabase = await createAuthClient();
        const { data, error } = await supabase.rpc('create_organization_section', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_translations: translations,
            p_order_index: orderIndex
        });

        if (error) throw new Error(`[SectionService] createSection Failed: ${error.message}`);
        return data as string; // UUID
    }

    // Update Section
    static async updateSection(
        tenantId: string,
        orgId: string,
        sectionId: string,
        translations: Record<string, string>,
        isPartial: boolean = true
    ): Promise<void> {
        const supabase = await createAuthClient();
        const { error } = await supabase.rpc('update_organization_section', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_section_id: sectionId,
            p_translations: translations,
            p_is_partial: isPartial
        });

        if (error) throw new Error(`[SectionService] updateSection Failed: ${error.message}`);
    }

    // Delete Section
    static async deleteSection(
        tenantId: string,
        orgId: string,
        sectionId: string
    ): Promise<void> {
        const supabase = await createAuthClient();
        const { error } = await supabase.rpc('delete_organization_section', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_section_id: sectionId
        });

        if (error) throw new Error(`[SectionService] deleteSection Failed: ${error.message}`);
    }

    // Reorder Sections
    static async reorderSections(
        tenantId: string,
        orgId: string,
        sectionIds: string[]
    ): Promise<void> {
        const supabase = await createAuthClient();
        const { error } = await supabase.rpc('reorder_sections', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_section_ids: sectionIds
        });

        if (error) throw new Error(`[SectionService] reorderSections Failed: ${error.message}`);
    }

    // Link App
    static async linkApp(
        tenantId: string,
        orgId: string,
        sectionId: string,
        moduleId: string
    ): Promise<void> {
        const supabase = await createAuthClient();
        const { error } = await supabase.rpc('link_app_to_section', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_section_id: sectionId,
            p_module_id: moduleId
        });

        if (error) throw new Error(`[SectionService] linkApp Failed: ${error.message}`);
    }

    // Unlink App (Item)
    static async unlinkItem(
        tenantId: string,
        orgId: string,
        itemId: string
    ): Promise<void> {
        const supabase = await createAuthClient();
        const { error } = await supabase.rpc('unlink_section_item', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_item_id: itemId
        });

        if (error) throw new Error(`[SectionService] unlinkItem Failed: ${error.message}`);
    }

    // Reorder Items
    static async reorderItems(
        tenantId: string,
        orgId: string,
        sectionId: string,
        itemIds: string[]
    ): Promise<void> {
        const supabase = await createAuthClient();
        const { error } = await supabase.rpc('reorder_section_items', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_section_id: sectionId,
            p_item_ids: itemIds
        });

        if (error) throw new Error(`[SectionService] reorderItems Failed: ${error.message}`);
    }
}
