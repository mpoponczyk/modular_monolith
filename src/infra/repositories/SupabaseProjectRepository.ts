// mateusz poponczyk
import { createAuthClient } from '@/infra/supabase/server-auth';
import { IProjectRepository } from '@/core/application/ports/IProjectRepository';
import { Project, Company } from '@/core/domain/types';

export class SupabaseProjectRepository implements IProjectRepository {
    async getProjects(tenantId: string, organizationId?: string): Promise<Project[]> {
        const supabase = createAuthClient();
        let query = supabase
            .from('projects')
            .select('*')
            .eq('tenant_id', tenantId);

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data as Project[];
    }

    async getProject(tenantId: string, projectId: string): Promise<Project | null> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('tenant_id', tenantId)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as Project | null;
    }

    async createProject(tenantId: string, organizationId: string, name: string): Promise<Project> {
        const supabase = createAuthClient();
        const { data: id, error } = await supabase.rpc('create_project', {
            p_tenant_id: tenantId,
            p_organization_id: organizationId,
            p_name: name
        });

        if (error) throw new Error(error.message);

        const project = await this.getProject(tenantId, id);
        if (!project) throw new Error('Project created but not found');
        return project;
    }

    async updateProject(tenantId: string, projectId: string, name: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('update_project', {
            p_tenant_id: tenantId,
            p_project_id: projectId,
            p_name: name
        });

        if (error) throw new Error(error.message);
    }

    async deleteProject(tenantId: string, projectId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_project', {
            p_tenant_id: tenantId,
            p_project_id: projectId
        });

        if (error) throw new Error(error.message);
    }

    async linkCompanyToProject(tenantId: string, projectId: string, companyId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('link_company_to_project', {
            p_tenant_id: tenantId,
            p_project_id: projectId,
            p_company_id: companyId
        });

        if (error) throw new Error(error.message);
    }

    async unlinkCompanyFromProject(tenantId: string, projectId: string, companyId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('unlink_company_from_project', {
            p_tenant_id: tenantId,
            p_project_id: projectId,
            p_company_id: companyId
        });

        if (error) throw new Error(error.message);
    }

    async getProjectCompanies(tenantId: string, projectId: string): Promise<Company[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('project_companies')
            .select('company:companies(*)')
            .eq('project_id', projectId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        return data.map((item: any) => item.company) as Company[];
    }
}
