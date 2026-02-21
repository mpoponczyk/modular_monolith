
export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    tenantId: string;
    isSystem: boolean; // Cannot be deleted if true
}

export interface CreateRoleDTO {
    name: string;
    description?: string;
    permissions: string[];
    tenantId: string;
}

export interface UpdateRoleDTO {
    description?: string;
    permissions?: string[];
}
