import { IReservationRepository } from "../domain/ports";
import { Reservation } from "../domain/types";
import { createAuthClient } from "@/infra/supabase/server-auth";

import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseReservationRepository implements IReservationRepository {
    constructor(private client?: SupabaseClient) { }

    async create(tenantId: string, reservation: Partial<Reservation>): Promise<string> {
        const supabase = this.client || createAuthClient();

        // RPC: create_reservation
        const { data, error } = await supabase.rpc('create_reservation', {
            p_tenant_id: tenantId,
            p_order_id: reservation.orderId,
            p_trip_id: reservation.tripId,
            p_total_amount: reservation.totalAmount,
            p_count_passengers: reservation.countPassengers || 0,
            p_count_vehicles: reservation.countVehicles || 0
        });

        if (error) {
            console.error("Error creating reservation:", error);
            throw new Error("Failed to create reservation");
        }

        return data;
    }

    async findByOrderId(tenantId: string, orderId: string): Promise<Reservation[]> {
        const supabase = this.client || createAuthClient();

        const { data, error } = await supabase
            .from("mnt_reservations")
            .select(`
                *,
                trip:mnt_trips(
                    id, departure_time, arrival_time,
                    route:mnt_routes(origin:mnt_locations!mnt_routes_origin_fkey(name), destination:mnt_locations!mnt_routes_dest_fkey(name)),
                    ferry:mnt_ferries(name)
                ),
                tickets:mnt_tickets(*)
            `)
            .eq("tenant_id", tenantId)
            .eq("order_id", orderId);

        if (error) {
            console.error("Error fetching reservations:", error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            tenantId: row.tenant_id,
            orderId: row.order_id,
            tripId: row.trip_id,
            status: row.status,
            totalAmount: row.total_amount,
            countPassengers: row.count_passengers,
            countVehicles: row.count_vehicles,
            // Nested relations
            trip: row.trip ? {
                id: row.trip.id,
                tenantId: row.tenant_id, // inherited
                routeId: row.trip.route_id, // might be missing if not selected
                ferryId: row.trip.ferry_id,
                departureTime: row.trip.departure_time,
                arrivalTime: row.trip.arrival_time,
                status: 'SCHEDULED', // simplifed
                isPublic: true,
                route: row.trip.route,
                ferry: row.trip.ferry
            } : undefined,
            tickets: row.tickets ? row.tickets.map((t: any) => ({
                id: t.id,
                tenantId: t.tenant_id,
                reservationId: t.reservation_id,
                serviceType: t.service_type,
                priceSold: t.price_sold,
                passengerName: t.passenger_name
            })) : []
        }));
    }

    async findById(tenantId: string, id: string): Promise<Reservation | null> {
        const supabase = this.client || createAuthClient();

        const { data, error } = await supabase
            .from("mnt_reservations")
            .select(`
                *,
                trip:mnt_trips(
                    id, departure_time, arrival_time,
                    route:mnt_routes(origin:mnt_locations!mnt_routes_origin_fkey(name), destination:mnt_locations!mnt_routes_dest_fkey(name)),
                    ferry:mnt_ferries(name)
                ),
                tickets:mnt_tickets(*)
            `)
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .single();

        if (error || !data) return null;

        const row = data;
        return {
            id: row.id,
            tenantId: row.tenant_id,
            orderId: row.order_id,
            tripId: row.trip_id,
            status: row.status,
            totalAmount: row.total_amount,
            countPassengers: row.count_passengers,
            countVehicles: row.count_vehicles,
            trip: row.trip ? {
                id: row.trip.id,
                tenantId: row.tenant_id,
                routeId: row.trip.route_id,
                ferryId: row.trip.ferry_id,
                departureTime: row.trip.departure_time,
                arrivalTime: row.trip.arrival_time,
                status: 'SCHEDULED',
                isPublic: true,
                route: row.trip.route,
                ferry: row.trip.ferry
            } : undefined,
            tickets: row.tickets ? row.tickets.map((t: any) => ({
                id: t.id,
                tenantId: t.tenant_id,
                reservationId: t.reservation_id,
                serviceType: t.service_type,
                priceSold: t.price_sold,
                passengerName: t.passenger_name
            })) : []
        };
    }

    async findAll(tenantId: string): Promise<Reservation[]> {
        const supabase = this.client || createAuthClient();

        const { data, error } = await supabase
            .from("mnt_reservations")
            .select(`
                *,
                trip:mnt_trips(
                    id, departure_time, arrival_time,
                    route:mnt_routes(origin:mnt_locations!mnt_routes_origin_fkey(name), destination:mnt_locations!mnt_routes_dest_fkey(name)),
                    ferry:mnt_ferries(name)
                ),
                order:mnt_orders(customer_email, customer_first_name, customer_last_name)
            `)
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching all reservations:", error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            tenantId: row.tenant_id,
            orderId: row.order_id,
            tripId: row.trip_id,
            status: row.status,
            totalAmount: row.total_amount,
            countPassengers: row.count_passengers,
            countVehicles: row.count_vehicles,
            // Nested relations
            trip: row.trip ? {
                id: row.trip.id,
                tenantId: row.tenant_id,
                routeId: row.trip.route_id,
                ferryId: row.trip.ferry_id,
                departureTime: row.trip.departure_time,
                arrivalTime: row.trip.arrival_time,
                status: 'SCHEDULED',
                isPublic: true,
                route: row.trip.route,
                ferry: row.trip.ferry
            } : undefined,
            order: row.order,
            tickets: []
        }));
    }

    async cancel(tenantId: string, id: string): Promise<void> {
        const supabase = this.client || createAuthClient();

        const { error } = await supabase.rpc('cancel_reservation', {
            p_tenant_id: tenantId,
            p_reservation_id: id
        });

        if (error) {
            console.error("Error cancelling reservation:", error);
            throw new Error("Failed to cancel reservation");
        }
    }
}
