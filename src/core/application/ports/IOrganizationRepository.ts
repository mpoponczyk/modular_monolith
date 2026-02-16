// mateusz poponczyk
import { Organization, Company } from '../../domain/types';

export interface IOrganizationRepository {
    getOrganizations(tenantId: string): Promise<Organization[]>;
    getOrganization(tenantId: string, orgId: string): Promise<Organization | null>;
    createOrganization(tenantId: string, name: string, ownerGroupId: string): Promise<Organization>;
    updateOrganization(tenantId: string, orgId: string, name?: string, ownerGroupId?: string): Promise<void>;
    deleteOrganization(tenantId: string, orgId: string): Promise<void>;
    linkCompanyToOrg(tenantId: string, orgId: string, companyId: string): Promise<void>;
    unlinkCompanyFromOrg(tenantId: string, orgId: string, companyId: string): Promise<void>;
    getOrgCompanies(tenantId: string, orgId: string): Promise<Company[]>;
}
