
export interface Manifest {
    tripId: string;
    tripDate: string;
    ferryName: string;
    routeName: string;
    passengers: PassengerManifestItem[];
    totalPassengers: number;
    tenantId: string;
}

export interface PassengerManifestItem {
    reservationId: string;
    name: string;
    ticketClass: string;
    status: string;
}

export interface ManifestFilterDTO {
    startDate?: string;
    endDate?: string;
    routeId?: string;
}
