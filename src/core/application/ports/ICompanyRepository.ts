import { Company } from '../../domain/types';

export interface ICompanyRepository {
    getCompanies(tenantId: string): Promise<Company[]>;
    getCompany(tenantId: string, companyId: string): Promise<Company | null>;
    createCompany(tenantId: string, name: string): Promise<Company>;
    updateCompany(tenantId: string, companyId: string, name: string): Promise<void>;
    deleteCompany(tenantId: string, companyId: string): Promise<void>;
    // Note: Linking companies to other entities is handled by the parent entity's repository (e.g. Org, Project)
}
