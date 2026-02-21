import { createAuthClient } from "@/infra/supabase/server-auth";
import { IManifestRepository, Manifest, ManifestFilterDTO, PassengerManifestItem } from "../domain/ports";

export class SupabaseManifestRepository implements IManifestRepository {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    private get supabase() {
        return this.client || createAuthClient();
    }

    // Fallback for interface compliance, we'll mostly use the specific UI methods below
    async findManifests(tenantId: string, filter: ManifestFilterDTO): Promise<Manifest[]> {
        return [];
    }
    async getManifestForTrip(tenantId: string, tripId: string): Promise<Manifest | null> {
        return null;
    }

    // specific UI methods mapping legacy expectations
    async getFerries(tenantId: string) {
        const { data, error } = await this.supabase
            .from('mnt_ferries')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');

        if (error) throw error;
        return data || [];
    }

    async getTripsForMonth(tenantId: string, startDate: Date, endDate: Date) {
        const { data, error } = await this.supabase
            .from('mnt_trips')
            .select(`
                *,
                route:mnt_routes(origin:mnt_locations!origin_id(name), destination:mnt_locations!destination_id(name)),
                ferry:mnt_ferries(*)
            `)
            .eq('tenant_id', tenantId)
            .gte('departure_time', startDate.toISOString())
            .lte('departure_time', endDate.toISOString())
            .order('departure_time', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async getTripDetail(tenantId: string, tripId: string) {
        // 1. Fetch Trip
        const { data: trip, error: tripError } = await this.supabase
            .from('mnt_trips')
            .select(`
                *,
                route:mnt_routes(origin:mnt_locations!origin_id(name), destination:mnt_locations!destination_id(name)),
                ferry:mnt_ferries(*)
            `)
            .eq('tenant_id', tenantId)
            .eq('id', tripId)
            .single();

        if (tripError || !trip) throw new Error("Trip not found");

        // 2. Fetch Reservations
        const { data: reservations, error: resError } = await this.supabase
            .from('mnt_reservations')
            .select(`
                *,
                tickets:mnt_tickets(*),
                zone:mnt_ferry_zones(name)
            `)
            .eq('tenant_id', tenantId)
            .eq('trip_id', tripId)
            .eq('status', 'CONFIRMED')
            .order('created_at', { ascending: true });

        if (resError) throw resError;

        return { trip, reservations: reservations || [] };
    }
}
