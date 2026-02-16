import { createAuthClient } from '@/infra/supabase/server-auth';
import { IOrganizationRepository } from '@/core/application/ports/IOrganizationRepository';
import { Organization, Company } from '@/core/domain/types';

export class SupabaseOrganizationRepository implements IOrganizationRepository {
    async getOrganizations(tenantId: string): Promise<Organization[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        return data as Organization[];
    }

    async getOrganization(tenantId: string, orgId: string): Promise<Organization | null> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .eq('tenant_id', tenantId)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as Organization | null;
    }

    async createOrganization(tenantId: string, name: string, ownerGroupId: string): Promise<Organization> {
        const supabase = createAuthClient();
        const { data: id, error } = await supabase.rpc('create_organization', {
            p_tenant_id: tenantId,
            p_name: name,
            p_owner_group_id: ownerGroupId
        });

        if (error) throw new Error(error.message);

        const org = await this.getOrganization(tenantId, id);
        if (!org) throw new Error('Organization created but not found');
        return org;
    }

    async updateOrganization(tenantId: string, orgId: string, name?: string, ownerGroupId?: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('update_organization', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_name: name || null,
            p_owner_group_id: ownerGroupId || null
        });

        if (error) throw new Error(error.message);
    }

    async deleteOrganization(tenantId: string, orgId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_organization', {
            p_tenant_id: tenantId,
            p_org_id: orgId
        });

        if (error) throw new Error(error.message);
    }

    async linkCompanyToOrg(tenantId: string, orgId: string, companyId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('link_company_to_org', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_company_id: companyId
        });

        if (error) throw new Error(error.message);
    }

    async unlinkCompanyFromOrg(tenantId: string, orgId: string, companyId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('unlink_company_from_org', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_company_id: companyId
        });

        if (error) throw new Error(error.message);
    }

    async getOrgCompanies(tenantId: string, orgId: string): Promise<Company[]> {
        const supabase = createAuthClient();
        // Join query
        const { data, error } = await supabase
            .from('org_companies')
            .select('company:companies(*)')
            .eq('organization_id', orgId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);

        // Map result. data is array of objects { company: Company }
        return data.map((item: any) => item.company) as Company[];
    }
}
