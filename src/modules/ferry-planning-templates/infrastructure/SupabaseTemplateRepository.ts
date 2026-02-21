
import { createAuthClient } from "@/infra/supabase/server-auth";
import { ITemplateRepository, CreateTemplateDTO, UpdateTemplateDTO, ScheduleTemplate } from "../domain/ports";

export class SupabaseTemplateRepository implements ITemplateRepository {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    private get supabase() {
        return this.client || createAuthClient();
    }

    async findAll(tenantId: string): Promise<ScheduleTemplate[]> {
        const { data, error } = await this.supabase
            .from('mnt_templates')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((t: any) => this.mapToDomain(t));
    }

    async findById(tenantId: string, id: string): Promise<ScheduleTemplate | null> {
        const { data, error } = await this.supabase
            .from('mnt_templates')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToDomain(data);
    }

    async create(tenantId: string, template: CreateTemplateDTO): Promise<string> {
        const { data, error } = await this.supabase.rpc('create_template', {
            p_tenant_id: tenantId,
            p_name: template.name,
            p_description: template.description || '',
            p_start_date: template.startDate,
            p_end_date: template.endDate,
            p_is_active: template.isActive
        });

        if (error) throw error;
        return data; // UUID
    }

    async update(tenantId: string, id: string, data: UpdateTemplateDTO): Promise<void> {
        const { error } = await this.supabase.rpc('update_template', {
            p_tenant_id: tenantId,
            p_template_id: id,
            p_name: data.name || null,
            p_description: data.description || null,
            p_start_date: data.startDate || null,
            p_end_date: data.endDate || null,
            p_is_active: data.isActive ?? null
        });

        if (error) throw error;
    }

    async delete(tenantId: string, id: string): Promise<void> {
        const { error } = await this.supabase.rpc('delete_template', {
            p_tenant_id: tenantId,
            p_template_id: id
        });

        if (error) throw error;
    }

    private mapToDomain(raw: any): ScheduleTemplate {
        return {
            id: raw.id,
            tenantId: raw.tenant_id,
            name: raw.name,
            description: raw.description,
            startDate: raw.start_date,
            endDate: raw.end_date,
            isActive: raw.is_active,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at
        };
    }
}
