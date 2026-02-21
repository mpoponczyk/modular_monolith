export interface FerryTrip {
    id: string;
    tenant_id: string;
    ferry_id: string;
    route_id: string;
    departure_time: string;
    arrival_time: string;
    status: string;
    is_public: boolean;
    booked_count: number;
    zone_config?: any;
    route?: any;
    ferry?: any;
}
