
export interface FerryRoute {
    id: string;
    tenantId: string;
    originId: string;
    destinationId: string;
    defaultFerryId?: string | null;
    defaultPriceProfileId?: string | null;
    estimatedDurationMinutes: number;
    isActive: boolean;
    // Relations (Joined)
    origin?: { id: string; name: string };
    destination?: { id: string; name: string };
    defaultFerry?: { id: string; name: string };
}

export interface Service {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    icon?: string;
    isActive: boolean;
}

export type TripStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type ReservationStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';

export interface TripPricing {
    id: string;
    tripId: string;
    serviceType: string; // ADULT, CHILD, BIKE...
    price: number;
    currency: string;
}

export interface FerryTrip {
    id: string;
    tenantId: string;
    routeId: string;
    ferryId: string;
    departureTime: string; // ISO String
    arrivalTime: string;
    status: TripStatus;
    isPublic: boolean;
    zoneConfig?: any;
    // Relations
    route?: FerryRoute;
    ferry?: { id: string; name: string };
    pricing?: TripPricing[];
}
