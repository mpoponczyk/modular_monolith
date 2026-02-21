
import { createAuthClient } from '@/infra/supabase/server-auth';
import { ServiceRepository, Service } from '../domain/service-types';

export class SupabaseServiceRepository implements ServiceRepository {
    constructor(private supabase: any, private tenantId: string) { }

    async getServices(): Promise<Service[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_services')
            .select('*')
            .eq('tenant_id', this.tenantId)
            .order('name');

        if (error) throw error;
        return data as Service[];
    }

    async upsertService(service: Partial<Service>): Promise<void> {
        const payload: any = {
            tenant_id: this.tenantId,
            name: service.name,
            description: service.description,
            icon: service.icon,
            is_active: service.is_active ?? true,
            updated_at: new Date().toISOString()
        };

        if (service.id) {
            payload.id = service.id;
        }

        const { error } = await this.supabase
            .from('mnt_services')
            .upsert(payload); // RLS handles tenant scope

        if (error) throw error;
    }

    async deleteService(serviceId: string): Promise<void> {
        const { error } = await this.supabase
            .from('mnt_services')
            .delete()
            .eq('id', serviceId)
            .eq('tenant_id', this.tenantId);

        if (error) throw error;
    }
}
