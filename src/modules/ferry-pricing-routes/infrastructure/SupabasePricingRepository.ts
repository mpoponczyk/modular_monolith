
import { createAuthClient } from "@/infra/supabase/server-auth";
import { IPricingRepository, CreateProfileDTO, UpdateProfileDTO, PriceProfile } from "../domain/ports";

export class SupabasePricingRepository implements IPricingRepository {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    private get supabase() {
        return this.client || createAuthClient();
    }

    async findAllProfiles(tenantId: string): Promise<PriceProfile[]> {
        const { data, error } = await this.supabase
            .from('mnt_price_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');

        if (error) throw error;
        return data.map((p: any) => this.mapToDomain(p));
    }

    async findProfileById(tenantId: string, id: string): Promise<PriceProfile | null> {
        const { data, error } = await this.supabase
            .from('mnt_price_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToDomain(data);
    }

    async createProfile(tenantId: string, profile: CreateProfileDTO): Promise<string> {
        const { data, error } = await this.supabase.rpc('create_pricing_profile', {
            p_tenant_id: tenantId,
            p_name: profile.name,
            p_description: profile.description || '',
            p_base_price_adult: profile.basePriceAdult || 0,
            p_base_price_child: profile.basePriceChild || 0,
            p_base_price_vehicle: profile.basePriceVehicle || 0,
            p_base_price_bike: profile.basePriceBike || 0,
            p_currency: profile.currency || 'USD',
            p_is_active: profile.isActive ?? true
        });

        if (error) throw error;
        return data; // UUID
    }

    async updateProfile(tenantId: string, id: string, data: UpdateProfileDTO): Promise<void> {
        const { error } = await this.supabase.rpc('update_pricing_profile', {
            p_tenant_id: tenantId,
            p_profile_id: id,
            p_name: data.name || null,
            p_description: data.description || null,
            p_base_price_adult: data.basePriceAdult ?? null,
            p_base_price_child: data.basePriceChild ?? null,
            p_base_price_vehicle: data.basePriceVehicle ?? null,
            p_base_price_bike: data.basePriceBike ?? null,
            p_currency: data.currency || null,
            p_is_active: data.isActive ?? null
        });

        if (error) throw error;
    }

    async deleteProfile(tenantId: string, id: string): Promise<void> {
        const { error } = await this.supabase.rpc('delete_pricing_profile', {
            p_tenant_id: tenantId,
            p_profile_id: id
        });

        if (error) throw error;
    }

    private mapToDomain(raw: any): PriceProfile {
        return {
            id: raw.id,
            tenantId: raw.tenant_id,
            name: raw.name,
            description: raw.description,
            basePriceAdult: raw.base_price_adult,
            basePriceChild: raw.base_price_child,
            basePriceVehicle: raw.base_price_vehicle,
            basePriceBike: raw.base_price_bike,
            currency: raw.currency,
            isActive: raw.is_active,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at
        };
    }
}
