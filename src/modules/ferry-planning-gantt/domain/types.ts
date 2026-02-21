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

export interface GanttTask {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    ferry_id: string;
}

export interface GanttRow {
    id: string;
    name: string;
    tasks: GanttTask[];
}
