// mateusz poponczyk
import { CompanyRole, CompanyUser, CompanyRolePermission } from '../../domain/types';

export interface ICompanyRbacRepository {
    getCompanyPermissions(tenantId: string, companyId: string, userId: string): Promise<string[]>;
    getCompanyRoles(tenantId: string, companyId: string): Promise<CompanyRole[]>;
    getCompanyUsers(tenantId: string, companyId: string): Promise<CompanyUser[]>;

    createCompanyRole(tenantId: string, companyId: string, name: string): Promise<CompanyRole>;
    deleteCompanyRole(tenantId: string, companyId: string, roleId: string): Promise<void>;

    addCompanyUser(tenantId: string, companyId: string, userId: string, roleId: string): Promise<void>;
    removeCompanyUser(tenantId: string, companyId: string, userId: string): Promise<void>;

    grantCompanyPermission(tenantId: string, roleId: string, permissionId: string): Promise<void>;
    revokeCompanyPermission(tenantId: string, roleId: string, permissionId: string): Promise<void>;
}
