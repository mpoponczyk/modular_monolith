import { IFerryRouteRepository } from "../domain/ports";
import { FerryRoute } from "../domain/types";
import { createAuthClient } from "@/infra/supabase/server-auth";

export class SupabaseFerryRouteRepository implements IFerryRouteRepository {
    async findAll(tenantId: string): Promise<FerryRoute[]> {
        const supabase = createAuthClient();

        // Explicitly filtering by tenant_id (Layered Defense with RLS)
        const { data, error } = await supabase
            .from("mnt_routes")
            .select(`
        *,
        origin:mnt_locations!origin_id(id, name),
        destination:mnt_locations!destination_id(id, name),
        default_ferry:mnt_ferries!default_ferry_id(id, name)
      `)
            .eq("tenant_id", tenantId)
            .eq("is_active", true);

        if (error) {
            console.error("Error fetching ferry routes:", error);
            throw new Error("Failed to fetch ferry routes");
        }

        // Map strict DB response to Domain Entity
        // Note: PostgREST returns matched relations as objects.
        return (data || []).map((row: any) => ({
            id: row.id,
            tenantId: row.tenant_id,
            originId: row.origin_id,
            destinationId: row.destination_id,
            defaultFerryId: row.default_ferry_id,
            defaultPriceProfileId: row.default_price_profile_id,
            estimatedDurationMinutes: row.estimated_duration_minutes,
            isActive: row.is_active,
            origin: row.origin,
            destination: row.destination,
            defaultFerry: row.default_ferry,
        }));
    }

    async findById(tenantId: string, id: string): Promise<FerryRoute | null> {
        const supabase = createAuthClient();

        const { data, error } = await supabase
            .from("mnt_routes")
            .select(`
        *,
        origin:mnt_locations!origin_id(id, name),
        destination:mnt_locations!destination_id(id, name),
        default_ferry:mnt_ferries!default_ferry_id(id, name)
      `)
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            tenantId: data.tenant_id,
            originId: data.origin_id,
            destinationId: data.destination_id,
            defaultFerryId: data.default_ferry_id,
            defaultPriceProfileId: data.default_price_profile_id,
            estimatedDurationMinutes: data.estimated_duration_minutes,
            isActive: data.is_active,
            origin: data.origin,
            destination: data.destination,
            defaultFerry: data.default_ferry,
        };
    }

    async create(tenantId: string, route: Omit<FerryRoute, 'id' | 'tenantId' | 'isActive' | 'origin' | 'destination' | 'defaultFerry'>): Promise<string> {
        const supabase = createAuthClient();

        // RPC Call: create_ferry_route
        // Note: RPC handles tenant validation (p_tenant_id must match auth.jwt -> tenant_id)
        const { data, error } = await supabase.rpc('create_ferry_route', {
            p_tenant_id: tenantId,
            p_origin_id: route.originId,
            p_destination_id: route.destinationId,
            p_estimated_duration: route.estimatedDurationMinutes,
            p_default_ferry_id: route.defaultFerryId || null
        });

        if (error) {
            console.error("Error creating ferry route:", error);
            throw new Error("Failed to create ferry route");
        }

        return data;
    }

    async update(tenantId: string, id: string, route: Partial<FerryRoute>): Promise<void> {
        const supabase = createAuthClient();

        // RPC Call: update_ferry_route
        // Note: For partial updates, we need to handle "undefined" vs "null".
        // The RPC expects explicit values. 
        // If we want to truly support partial, we might need to fetch first or pass all fields.
        // For now, mapping undefined to null is common but risky if null means "unset" vs "ignore".
        // My RPC uses COALESCE, so passing NULL means IGNORE.
        // To UNSET a value, we would need a specific sentinel or separate RPC.
        // Assuming undefined/null -> null -> ignore for now.

        const { error } = await supabase.rpc('update_ferry_route', {
            p_tenant_id: tenantId,
            p_route_id: id,
            p_origin_id: route.originId || null,
            p_destination_id: route.destinationId || null,
            p_estimated_duration: route.estimatedDurationMinutes || null,
            p_default_ferry_id: route.defaultFerryId || null,
            p_default_price_profile_id: route.defaultPriceProfileId || null,
            p_is_active: route.isActive ?? null
        });

        if (error) {
            console.error("Error updating ferry route:", error);
            throw new Error("Failed to update ferry route");
        }
    }

    async delete(tenantId: string, id: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_ferry_route', {
            p_tenant_id: tenantId,
            p_route_id: id
        });

        if (error) {
            console.error("Error deleting ferry route:", error);
            throw new Error("Failed to delete ferry route");
        }
    }

    async getLocations(tenantId: string): Promise<{ id: string; name: string }[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_locations')
            .select('id, name')
            .eq('tenant_id', tenantId);

        if (error) throw new Error("Failed to fetch locations");
        return data || [];
    }

    async getFerries(tenantId: string): Promise<{ id: string; name: string }[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_ferries')
            .select('id, name')
            .eq('tenant_id', tenantId);

        if (error) throw new Error("Failed to fetch ferries");
        return data || [];
    }
}
