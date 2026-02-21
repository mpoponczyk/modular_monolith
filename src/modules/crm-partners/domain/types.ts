
export interface Partner {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    phone?: string;
    commissionRate: number; // Percentage (0-100) or decimal (0-1) - Standardize on Percentage
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePartnerDTO {
    name: string;
    email: string;
    phone?: string;
    commissionRate: number;
    isActive: boolean;
}

export interface UpdatePartnerDTO {
    name?: string;
    email?: string;
    phone?: string;
    commissionRate?: number;
    isActive?: boolean;
}

export interface Customer {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
    source?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerDTO {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
    source?: string;
    isActive: boolean;
}

export interface UpdateCustomerDTO {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    notes?: string;
    source?: string;
    isActive?: boolean;
}
