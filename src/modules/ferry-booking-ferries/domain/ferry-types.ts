
export type Ferry = {
    id: string;
    tenant_id: string;
    name: string;
    capacity_pax: number;
    capacity_cars: number;
    capacity_passengers?: number;
    capacity_bikes?: number;
    capacity_pets?: number;
    is_active: boolean;
    created_at: string;
    zones?: any[];
};
