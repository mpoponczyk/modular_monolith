import {
    FerryRoute,
    Service,
    TripStatus,
    OrderStatus,
    PaymentStatus,
    ReservationStatus,
    TripPricing,
    FerryTrip
} from '@/shared/types/ferry';

export type {
    FerryRoute,
    Service,
    TripStatus,
    OrderStatus,
    PaymentStatus,
    ReservationStatus,
    TripPricing,
    FerryTrip
};

// Continue defining Order, Reservation, Ticket, Invoice below.

export interface Order {
    id: string;
    tenantId: string;
    customerEmail: string;
    customerFirstName?: string;
    customerLastName?: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    currency: string;
    createdAt: string;
    // Relations
    reservations?: Reservation[];
    invoices?: Invoice[];
}

export interface Reservation {
    id: string;
    tenantId: string;
    orderId?: string;
    tripId: string;
    status: ReservationStatus;
    totalAmount: number;
    countPassengers: number;
    countVehicles: number;
    customerEmail?: string;
    // Relations
    order?: any;
    trip?: FerryTrip;
    tickets?: Ticket[];
}

export interface Ticket {
    id: string;
    tenantId: string;
    reservationId: string;
    serviceType: string;
    priceSold: number;
    passengerName?: string;
}

export interface Invoice {
    id: string;
    tenantId: string;
    orderId: string;
    invoiceNumber: string;
    buyerData?: any;
    amountTotal: number;
    fileUrl?: string;
}
