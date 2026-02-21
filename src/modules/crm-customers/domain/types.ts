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
