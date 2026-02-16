// mateusz poponczyk
import { Project, Company } from '../../domain/types';

export interface IProjectRepository {
    getProjects(tenantId: string, organizationId?: string): Promise<Project[]>;
    getProject(tenantId: string, projectId: string): Promise<Project | null>;
    createProject(tenantId: string, organizationId: string, name: string): Promise<Project>;
    updateProject(tenantId: string, projectId: string, name: string): Promise<void>;
    deleteProject(tenantId: string, projectId: string): Promise<void>;
    linkCompanyToProject(tenantId: string, projectId: string, companyId: string): Promise<void>;
    unlinkCompanyFromProject(tenantId: string, projectId: string, companyId: string): Promise<void>;
    getProjectCompanies(tenantId: string, projectId: string): Promise<Company[]>;
}
