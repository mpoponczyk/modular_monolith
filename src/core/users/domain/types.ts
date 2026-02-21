
export interface User {
    id: string;
    email: string;
    fullName?: string;
    role: string;
    tenantId: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
}

export interface CreateUserDTO {
    email: string;
    fullName?: string;
    role: string;
    tenantId: string;
}

export interface UpdateUserDTO {
    fullName?: string;
    role?: string;
    isActive?: boolean;
}
