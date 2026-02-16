import { ServiceOffering, Company } from '../../domain/types';

export interface IServiceOfferingRepository {
    getServiceOfferings(tenantId: string, projectId?: string): Promise<ServiceOffering[]>;
    getServiceOffering(tenantId: string, offeringId: string): Promise<ServiceOffering | null>;
    createServiceOffering(tenantId: string, projectId: string, name: string, ownerGroupId: string): Promise<ServiceOffering>;
    updateServiceOffering(tenantId: string, offeringId: string, name: string, ownerGroupId?: string): Promise<void>;
    deleteServiceOffering(tenantId: string, offeringId: string): Promise<void>;
    linkCompanyToServiceOffering(tenantId: string, offeringId: string, companyId: string): Promise<void>;
    unlinkCompanyFromServiceOffering(tenantId: string, offeringId: string, companyId: string): Promise<void>;
    getServiceOfferingCompanies(tenantId: string, offeringId: string): Promise<Company[]>;
}
