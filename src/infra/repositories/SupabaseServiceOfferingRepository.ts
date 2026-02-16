// mateusz poponczyk
import { createAuthClient } from '@/infra/supabase/server-auth';
import { IServiceOfferingRepository } from '@/core/application/ports/IServiceOfferingRepository';
import { ServiceOffering, Company } from '@/core/domain/types';

export class SupabaseServiceOfferingRepository implements IServiceOfferingRepository {
    async getServiceOfferings(tenantId: string, projectId?: string): Promise<ServiceOffering[]> {
        const supabase = createAuthClient();
        let query = supabase
            .from('service_offerings')
            .select('*')
            .eq('tenant_id', tenantId);

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data as ServiceOffering[];
    }

    async getServiceOffering(tenantId: string, offeringId: string): Promise<ServiceOffering | null> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('service_offerings')
            .select('*')
            .eq('id', offeringId)
            .eq('tenant_id', tenantId)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as ServiceOffering | null;
    }

    async createServiceOffering(tenantId: string, projectId: string, name: string, ownerGroupId: string): Promise<ServiceOffering> {
        const supabase = createAuthClient();
        const { data: id, error } = await supabase.rpc('create_service_offering', {
            p_tenant_id: tenantId,
            p_project_id: projectId,
            p_name: name,
            p_owner_group_id: ownerGroupId
        });

        if (error) throw new Error(error.message);

        const offering = await this.getServiceOffering(tenantId, id);
        if (!offering) throw new Error('Service Offering created but not found');
        return offering;
    }

    async updateServiceOffering(tenantId: string, offeringId: string, name: string, ownerGroupId?: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('update_service_offering', {
            p_tenant_id: tenantId,
            p_offering_id: offeringId,
            p_name: name,
            p_owner_group_id: ownerGroupId || null
        });

        if (error) throw new Error(error.message);
    }

    async deleteServiceOffering(tenantId: string, offeringId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_service_offering', {
            p_tenant_id: tenantId,
            p_offering_id: offeringId
        });

        if (error) throw new Error(error.message);
    }

    async linkCompanyToServiceOffering(tenantId: string, offeringId: string, companyId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('link_company_to_service_offering', {
            p_tenant_id: tenantId,
            p_offering_id: offeringId,
            p_company_id: companyId
        });

        if (error) throw new Error(error.message);
    }

    async unlinkCompanyFromServiceOffering(tenantId: string, offeringId: string, companyId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('unlink_company_from_service_offering', {
            p_tenant_id: tenantId,
            p_offering_id: offeringId,
            p_company_id: companyId
        });

        if (error) throw new Error(error.message);
    }

    async getServiceOfferingCompanies(tenantId: string, offeringId: string): Promise<Company[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('service_offering_companies')
            .select('company:companies(*)')
            .eq('service_offering_id', offeringId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        return data.map((item: any) => item.company) as Company[];
    }
}
