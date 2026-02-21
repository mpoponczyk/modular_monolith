
export interface Service {
    id: string;
    description?: string;
    icon?: string;
    is_active: boolean;
    name: string;
    tenant_id: string;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceRepository {
    getServices(): Promise<Service[]>;
    upsertService(service: Partial<Service>): Promise<void>;
    deleteService(serviceId: string): Promise<void>;
}
