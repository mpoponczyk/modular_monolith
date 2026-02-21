import { FerryRoute, FerryTrip, Order, Reservation } from "../domain/types";

export interface IFerryRouteRepository {
    findAll(tenantId: string): Promise<FerryRoute[]>;
    findById(tenantId: string, id: string): Promise<FerryRoute | null>;
    create(tenantId: string, route: Omit<FerryRoute, 'id' | 'tenantId' | 'isActive' | 'origin' | 'destination' | 'defaultFerry'>): Promise<string>;
    update(tenantId: string, id: string, route: Partial<FerryRoute>): Promise<void>;
    delete(tenantId: string, id: string): Promise<void>;
    getLocations(tenantId: string): Promise<{ id: string; name: string }[]>;
    getFerries(tenantId: string): Promise<{ id: string; name: string }[]>;
}

export interface ITripRepository {
    findAll(tenantId: string, routeId?: string, date?: string): Promise<FerryTrip[]>;
    findById(tenantId: string, id: string): Promise<FerryTrip | null>;
    create(tenantId: string, trip: Partial<FerryTrip>): Promise<string>;
    delete(tenantId: string, id: string): Promise<void>;
    update(tenantId: string, id: string, trip: Partial<FerryTrip>): Promise<void>;
}

export interface IOrderRepository {
    create(tenantId: string, order: Partial<Order>): Promise<string>;
    findById(tenantId: string, id: string): Promise<Order | null>;
    findAll(tenantId: string): Promise<Order[]>;
}

export interface IReservationRepository {
    create(tenantId: string, reservation: Partial<Reservation>): Promise<string>;
    findByOrderId(tenantId: string, orderId: string): Promise<Reservation[]>;
    findById(tenantId: string, id: string): Promise<Reservation | null>;
    findAll(tenantId: string): Promise<Reservation[]>;
    cancel(tenantId: string, id: string): Promise<void>;
}
