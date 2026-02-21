
import { createAuthClient } from "@/infra/supabase/server-auth";
import { IGanttService } from "../domain/ports";
import { GanttRow, GanttTask } from "../domain/types";


export class SupabaseGanttService implements IGanttService {
    async getGanttData(tenantId: string, startDate: string, endDate: string): Promise<GanttRow[]> {
        // 1. Fetch Ferries (Resources)
        const supabase = createAuthClient();
        const { data: ferries, error: ferryError } = await supabase
            .from('mnt_ferries')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');

        if (ferryError) throw ferryError;

        // 2. Fetch Trips for the range
        // We need to use the Repo to ensure we get the domain objects correctly, 
        // OR we can query directly if we need specific optimized relational data.
        // The Repo `findAll` currently takes `date` (single day). We need a range.
        // Let's use direct query here for efficiency and range support, or extend Repo.
        // Extending Repo is better for architecture, but for now I will query directly to ensure 
        // I get exactly what I need for the visualizer without over-fetching.
        // Actually, let's use the Repo pattern but I'll add a range query method if needed, 
        // or just use raw query here as "GanttService" is a specialized infrastructure service.

        const { data: trips, error: tripError } = await supabase
            .from('mnt_trips')
            .select(`
                id,
                ferry_id,
                departure_time,
                arrival_time,
                status,
                route:mnt_routes!route_id(
                    origin:mnt_locations!mnt_routes_origin_fkey(name),
                    destination:mnt_locations!mnt_routes_dest_fkey(name)
                )
            `)
            .eq('tenant_id', tenantId)
            .gte('departure_time', startDate)
            .lte('departure_time', endDate);

        if (tripError) throw tripError;

        // 3. Map to Gantt Rows
        const rows: GanttRow[] = ferries.map((ferry: any) => {
            const ferryTrips = trips?.filter((t: any) => t.ferry_id === ferry.id) || [];

            const tasks: GanttTask[] = ferryTrips.map((t: any) => ({
                id: t.id,
                title: `${t.route?.origin?.name || '?'} → ${t.route?.destination?.name || '?'}`,
                start_time: t.departure_time,
                end_time: t.arrival_time,
                status: t.status,
                ferry_id: ferry.id
            }));

            return {
                id: ferry.id,
                name: ferry.name,
                tasks: tasks
            };
        });

        return rows;
    }
}
