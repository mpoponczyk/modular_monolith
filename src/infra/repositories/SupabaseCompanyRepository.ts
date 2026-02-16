import { createAuthClient } from '@/infra/supabase/server-auth';
import { ICompanyRepository } from '@/core/application/ports/ICompanyRepository';
import { Company } from '@/core/domain/types';

export class SupabaseCompanyRepository implements ICompanyRepository {
    async getCompanies(tenantId: string): Promise<Company[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        return data as Company[];
    }

    async getCompany(tenantId: string, companyId: string): Promise<Company | null> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .eq('tenant_id', tenantId)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as Company | null;
    }

    async createCompany(tenantId: string, name: string): Promise<Company> {
        const supabase = createAuthClient();
        const { data: id, error } = await supabase.rpc('create_company', {
            p_tenant_id: tenantId,
            p_name: name
        });

        if (error) throw new Error(error.message);

        const company = await this.getCompany(tenantId, id);
        if (!company) throw new Error('Company created but not found');
        return company;
    }

    async updateCompany(tenantId: string, companyId: string, name: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('update_company', {
            p_tenant_id: tenantId,
            p_company_id: companyId,
            p_name: name
        });

        if (error) throw new Error(error.message);
    }

    async deleteCompany(tenantId: string, companyId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_company', {
            p_tenant_id: tenantId,
            p_company_id: companyId
        });

        if (error) throw new Error(error.message);
    }
}
