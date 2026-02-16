/**
 * Business Hierarchy Domain Entities
 * Strict types matching database schema.
 */

export interface Group {
    id: string;
    tenant_id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface GroupMember {
    group_id: string;
    user_id: string;
    tenant_id: string;
    created_at: string;
}

export interface Organization {
    id: string;
    tenant_id: string;
    name: string;
    owner_group_id: string;
    created_at: string;
    updated_at: string;
}

export interface Company {
    id: string;
    tenant_id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    tenant_id: string;
    organization_id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface ServiceOffering {
    id: string;
    tenant_id: string;
    project_id: string;
    name: string;
    owner_group_id: string;
    created_at: string;
    updated_at: string;
}

export interface CompanyRole {
    id: string;
    tenant_id: string;
    company_id: string;
    name: string;
    created_at: string;
}

export interface CompanyUser {
    company_id: string;
    user_id: string;
    role_id: string;
    tenant_id: string;
}

export interface CompanyRolePermission {
    role_id: string;
    permission_id: string;
}
