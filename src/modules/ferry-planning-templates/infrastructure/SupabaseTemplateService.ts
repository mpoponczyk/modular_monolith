import { createAuthClient } from '@/infra/supabase/server-auth';

export class SupabaseTemplateService {
    async getTemplatesWithItems(tenantId: string) {
        const supabase = createAuthClient();

        const { data, error } = await supabase.from("mnt_templates")
            .select(`
                *,
                items:mnt_template_items(
                    *,
                    route:mnt_routes(
                        origin:mnt_locations!origin_id(name),
                        destination:mnt_locations!destination_id(name),
                        estimated_duration_minutes
                    )
                )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching templates:", error);
            throw new Error("Failed to fetch templates with items");
        }

        return data || [];
    }

    async getRoutesForDropdown(tenantId: string) {
        const supabase = createAuthClient();

        const { data, error } = await supabase.from("mnt_routes")
            .select(`
                id, 
                origin:mnt_locations!origin_id(name), 
                destination:mnt_locations!destination_id(name),
                estimated_duration_minutes,
                is_active
            `)
            .eq('tenant_id', tenantId)
            .eq('is_active', true);

        if (error) {
            console.error("Error fetching routes:", error);
            throw new Error("Failed to fetch routes");
        }

        // The legacy app used `is_standard` which is not on `mnt_routes`, so we ignore it here
        // or map it from something else if needed. We'll return them directly.
        return data || [];
    }

    async createTemplate(tenantId: string, name: string, description: string) {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('create_template', {
            p_tenant_id: tenantId,
            p_name: name,
            p_description: description || '',
            p_start_date: new Date().toISOString().split('T')[0], // Templates need a start/end date, default to today
            p_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            p_is_active: true
        });

        if (error) throw new Error(error.message);
    }

    async deleteTemplate(tenantId: string, templateId: string) {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_template', {
            p_tenant_id: tenantId,
            p_template_id: templateId
        });

        if (error) throw new Error(error.message);
    }

    async addItemToTemplate(tenantId: string, templateId: string, routeId: string, departureTime: string) {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('add_template_item', {
            p_tenant_id: tenantId,
            p_template_id: templateId,
            p_route_id: routeId,
            p_departure_time: departureTime
        });

        if (error) throw new Error(error.message);
    }

    async deleteTemplateItem(tenantId: string, itemId: string) {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_template_item', {
            p_tenant_id: tenantId,
            p_item_id: itemId
        });

        if (error) throw new Error(error.message);
    }
}
