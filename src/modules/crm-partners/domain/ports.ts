
export interface Partner {
    id: string;
    tenantId: string;
    name: string;
    email?: string;
    phone?: string;
    commissionRate: number;
    isActive: boolean;
    type: 'SELLER' | 'BUYER' | 'BOTH';
    nip?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePartnerDTO {
    name: string;
    email?: string;
    phone?: string;
    commissionRate?: number;
    isActive?: boolean;
    type?: 'SELLER' | 'BUYER' | 'BOTH';
    nip?: string;
    address?: string;
    postalCode?: string;
    city?: string;
}

export interface UpdatePartnerDTO extends Partial<CreatePartnerDTO> { }


export interface IPartnerRepository {
    findAll(tenantId: string): Promise<Partner[]>;
    findById(tenantId: string, id: string): Promise<Partner | null>;
    create(tenantId: string, partner: CreatePartnerDTO): Promise<string>;
    update(tenantId: string, id: string, data: UpdatePartnerDTO): Promise<void>;
    delete(tenantId: string, id: string): Promise<void>;
}
