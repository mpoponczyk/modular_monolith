import { ITripRepository } from "../domain/ports";
import { FerryTrip } from "../domain/types";
import { createAuthClient } from "@/infra/supabase/server-auth";

import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseTripRepository implements ITripRepository {
    constructor(private client?: SupabaseClient) { }

    async findAll(tenantId: string, routeId?: string, date?: string): Promise<FerryTrip[]> {
        const supabase = this.client || createAuthClient();

        let query = supabase
            .from("mnt_trips")
            .select(`
        *,
        route:mnt_routes!route_id(
            id, tenant_id, origin_id, destination_id, estimated_duration_minutes, is_active,
            origin:mnt_locations!mnt_routes_origin_fkey(id, name),
            destination:mnt_locations!mnt_routes_dest_fkey(id, name)
        ),
        ferry:mnt_ferries!ferry_id(id, name),
        pricing:mnt_trip_pricing(id, service_type, price, currency)
      `)
            .eq("tenant_id", tenantId);

        if (routeId) {
            query = query.eq("route_id", routeId);
        }

        if (date) {
            // Filter by date (ignoring time)
            // departure_time is timestamptz. 
            // supabase doesn't support easy DATE() casting in filters directly without raw SQL or range
            // simplified: use gte/lte for the day
            const startOfDay = `${date}T00:00:00.000Z`;
            const endOfDay = `${date}T23:59:59.999Z`;
            query = query.gte('departure_time', startOfDay).lte('departure_time', endOfDay);
        }

        const { data, error } = await query.order('departure_time', { ascending: true });

        if (error) {
            console.error("Error fetching trips:", error);
            throw new Error("Failed to fetch trips");
        }

        return (data || []).map((row: any) => this.mapToDomain(row));
    }

    async findById(tenantId: string, id: string): Promise<FerryTrip | null> {
        const supabase = this.client || createAuthClient();

        const { data, error } = await supabase
            .from("mnt_trips")
            .select(`
        *,
        route:mnt_routes!route_id(
            id, tenant_id, origin_id, destination_id, estimated_duration_minutes, is_active,
            origin:mnt_locations!mnt_routes_origin_fkey(id, name),
            destination:mnt_locations!mnt_routes_dest_fkey(id, name)
        ),
        ferry:mnt_ferries!ferry_id(id, name),
        pricing:mnt_trip_pricing(id, service_type, price, currency)
      `)
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .single();

        if (error) return null;

        return this.mapToDomain(data);
    }

    async create(tenantId: string, trip: Partial<FerryTrip>): Promise<string> {
        const supabase = this.client || createAuthClient();

        // RPC: create_trip
        const { data, error } = await supabase.rpc('create_trip', {
            p_tenant_id: tenantId,
            p_route_id: trip.routeId,
            p_ferry_id: trip.ferryId,
            p_departure_time: trip.departureTime,
            p_arrival_time: trip.arrivalTime,
            p_is_public: trip.isPublic ?? true,
            p_zone_config: trip.zoneConfig || {}
        });

        if (error) {
            console.error("Error creating trip:", error);
            throw new Error("Failed to create trip");
        }

        return data; // Returns UUID
    }

    async delete(tenantId: string, id: string): Promise<void> {
        const supabase = this.client || createAuthClient();

        const { error } = await supabase.rpc('delete_trip', {
            p_tenant_id: tenantId,
            p_trip_id: id
        });

        if (error) {
            console.error("Error deleting trip:", error);
            throw new Error("Failed to delete trip");
        }
    }

    async update(tenantId: string, id: string, trip: Partial<FerryTrip>): Promise<void> {
        const supabase = this.client || createAuthClient();

        const { error } = await supabase.rpc('update_trip', {
            p_tenant_id: tenantId,
            p_trip_id: id,
            p_departure_time: trip.departureTime,
            p_arrival_time: trip.arrivalTime,
            p_is_public: trip.isPublic,
            p_zone_config: trip.zoneConfig
        });

        if (error) {
            console.error("Error updating trip:", error);
            throw new Error("Failed to update trip");
        }
    }

    private mapToDomain(row: any): FerryTrip {
        return {
            id: row.id,
            tenantId: row.tenant_id,
            routeId: row.route_id,
            ferryId: row.ferry_id,
            departureTime: row.departure_time,
            arrivalTime: row.arrival_time,
            status: row.status,
            isPublic: row.is_public,
            zoneConfig: row.zone_config,
            route: row.route ? {
                id: row.route.id,
                tenantId: row.route.tenant_id,
                originId: row.route.origin_id,
                destinationId: row.route.destination_id,
                estimatedDurationMinutes: row.route.estimated_duration_minutes,
                isActive: row.route.is_active,
                origin: row.route.origin,
                destination: row.route.destination
            } : undefined,
            ferry: row.ferry,
            pricing: row.pricing ? row.pricing.map((p: any) => ({
                id: p.id,
                tripId: row.id, // implicit
                serviceType: p.service_type,
                price: p.price,
                currency: p.currency
            })) : []
        };
    }
}
