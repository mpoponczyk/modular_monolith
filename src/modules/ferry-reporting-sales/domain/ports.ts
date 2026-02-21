
export interface SalesMetrics {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    currency: string;
}

export interface SalesDailyRevenue {
    date: string;
    revenue: number;
}

export interface TicketBreakdown {
    category: string;
    count: number;
    revenue: number;
}

export interface ISalesRepository {
    getMetrics(tenantId: string, startDate: string, endDate: string): Promise<SalesMetrics>;
    getDailyRevenue(tenantId: string, startDate: string, endDate: string): Promise<SalesDailyRevenue[]>;
    getTicketBreakdown(tenantId: string, startDate: string, endDate: string): Promise<TicketBreakdown[]>;
}

export interface ManifestFilterDTO {
    startDate?: string;
    endDate?: string;
}

export interface PassengerManifestItem {
    reservationId: string;
    name: string;
    ticketClass: string;
    status: string;
}

export interface Manifest {
    tripId: string;
    tripDate: string;
    ferryName: string;
    routeName: string;
    totalPassengers: number;
    tenantId: string;
    passengers: PassengerManifestItem[];
}

export interface IManifestRepository {
    findManifests(tenantId: string, filter: ManifestFilterDTO): Promise<Manifest[]>;
    getManifestForTrip(tenantId: string, tripId: string): Promise<Manifest | null>;
}
