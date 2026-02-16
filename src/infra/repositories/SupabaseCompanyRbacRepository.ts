// mateusz poponczyk
import { createAuthClient } from '@/infra/supabase/server-auth';
import { ICompanyRbacRepository } from '@/core/application/ports/ICompanyRbacRepository';
import { CompanyRole, CompanyUser, CompanyRolePermission } from '@/core/domain/types';

export class SupabaseCompanyRbacRepository implements ICompanyRbacRepository {

    async getCompanyPermissions(tenantId: string, companyId: string, userId: string): Promise<string[]> {
        const supabase = createAuthClient();

        // Query structure: company_users -> role -> role_permissions -> permission
        const { data, error } = await supabase
            .from('company_users')
            .select(`
        role:company_roles!inner (
          permissions:company_role_permissions (
            permission:permissions (
              name
            )
          )
        )
      `)
            .eq('company_id', companyId)
            .eq('user_id', userId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);

        // Flatten results
        const permissions: Set<string> = new Set();

        // data is array of company_users (usually 1 if strict checks, but could be multiple if multiple roles - though schema says PK(company_id, user_id) so max 1 user per company)
        // Wait, DB schema: primary key (company_id, user_id). So 1 role per user per company.

        if (data && data.length > 0) {
            const userRole = data[0].role as any;
            if (userRole && userRole.permissions) {
                userRole.permissions.forEach((rp: any) => {
                    if (rp.permission && rp.permission.name) {
                        permissions.add(rp.permission.name);
                    }
                });
            }
        }

        return Array.from(permissions);
    }

    async getCompanyRoles(tenantId: string, companyId: string): Promise<CompanyRole[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('company_roles')
            .select('*')
            .eq('company_id', companyId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        return data as CompanyRole[];
    }

    async getCompanyUsers(tenantId: string, companyId: string): Promise<CompanyUser[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('company_users')
            .select('*')
            .eq('company_id', companyId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        return data as CompanyUser[];
    }

    async createCompanyRole(tenantId: string, companyId: string, name: string): Promise<CompanyRole> {
        const supabase = createAuthClient();
        const { data: id, error } = await supabase.rpc('create_company_role', {
            p_tenant_id: tenantId,
            p_company_id: companyId,
            p_name: name
        });

        if (error) throw new Error(error.message);

        // Fetch returned role
        const { data: role, error: fetchError } = await supabase
            .from('company_roles')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw new Error(fetchError.message);
        return role as CompanyRole;
    }

    async deleteCompanyRole(tenantId: string, companyId: string, roleId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_company_role', {
            p_tenant_id: tenantId,
            p_company_id: companyId,
            p_role_id: roleId
        });

        if (error) throw new Error(error.message);
    }

    async addCompanyUser(tenantId: string, companyId: string, userId: string, roleId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('add_company_user', {
            p_tenant_id: tenantId,
            p_company_id: companyId,
            p_user_id: userId,
            p_role_id: roleId
        });

        if (error) throw new Error(error.message);
    }

    async removeCompanyUser(tenantId: string, companyId: string, userId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('remove_company_user', {
            p_tenant_id: tenantId,
            p_company_id: companyId,
            p_user_id: userId
        });

        if (error) throw new Error(error.message);
    }

    async grantCompanyPermission(tenantId: string, roleId: string, permissionId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('grant_company_permission', {
            p_tenant_id: tenantId,
            p_role_id: roleId,
            p_permission_id: permissionId
        });

        if (error) throw new Error(error.message);
    }

    async revokeCompanyPermission(tenantId: string, roleId: string, permissionId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('revoke_company_permission', {
            p_tenant_id: tenantId,
            p_role_id: roleId,
            p_permission_id: permissionId
        });

        if (error) throw new Error(error.message);
    }
}
