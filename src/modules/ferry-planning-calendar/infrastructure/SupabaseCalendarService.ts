import { createAuthClient } from '@/infra/supabase/server-auth';
import { FerryTrip as Trip } from '../domain/types';

export class SupabaseCalendarService {
    async getTripsForRange(tenantId: string, startDate: string, endDate: string): Promise<Trip[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_trips')
            .select(`
                id, tenant_id, ferry_id, route_id, departure_time, arrival_time, status, is_public, booked_count, zone_config,
                route:mnt_routes!route_id(origin:mnt_locations!mnt_routes_origin_fkey(name), destination:mnt_locations!mnt_routes_dest_fkey(name)),
                ferry:mnt_ferries!ferry_id(name, capacity_passengers)
            `)
            .eq('tenant_id', tenantId)
            .gte('departure_time', startDate)
            .lte('departure_time', endDate);

        if (error) throw error;
        return data as any as Trip[];
    }

    async getFerries(tenantId: string): Promise<any[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_ferries')
            .select('*')
            .eq('tenant_id', tenantId);
        if (error) throw error;
        return data;
    }

    async getRoutes(tenantId: string): Promise<any[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_routes')
            .select(`
                *,
                origin:mnt_locations!mnt_routes_origin_fkey(name),
                destination:mnt_locations!mnt_routes_dest_fkey(name)
            `)
            .eq('tenant_id', tenantId);
        if (error) throw error;
        return data;
    }

    async getOperationalStatuses(tenantId: string, startDate: string, endDate: string): Promise<any[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_ferry_operational_status')
            .select('*')
            .eq('tenant_id', tenantId)
            .gte('date', startDate)
            .lte('date', endDate);
        if (error && error.code !== '42P01') {
            console.warn("Ferry operational status table missing or error:", error);
            return [];
        }
        return data || [];
    }

    async createTrip(tenantId: string, data: any): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.from('mnt_trips').insert({ tenant_id: tenantId, ...data });
        if (error) throw error;
    }

    async updateTrip(tenantId: string, tripId: string, data: any): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.from('mnt_trips').update(data).eq('id', tripId).eq('tenant_id', tenantId);
        if (error) throw error;
    }

    async deleteTrip(tenantId: string, tripId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.from('mnt_trips').delete().eq('id', tripId).eq('tenant_id', tenantId);
        if (error) throw error;
    }
}
