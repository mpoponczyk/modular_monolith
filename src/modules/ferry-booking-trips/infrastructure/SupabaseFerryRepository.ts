
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/infra/database.types';
import { Ferry } from '../domain/types';

export class SupabaseFerryRepository {
    constructor(private supabase: SupabaseClient<Database>, private tenantId: string) {
        if (!tenantId) throw new Error('Tenant ID is required for FerriesRepository');
    }

    async listFerries(): Promise<Ferry[]> {
        const { data, error } = await this.supabase
            .from('mnt_ferries')
            .select('*')
            .eq('tenant_id', this.tenantId)
            .order('name');

        if (error) throw error;
        return data as unknown as Ferry[];
    }

    async createFerry(ferry: { name: string; capacity_pax: number; capacity_cars: number }): Promise<Ferry> {
        const { data, error } = await this.supabase
            .from('mnt_ferries')
            .insert({
                tenant_id: this.tenantId,
                name: ferry.name,
                capacity_pax: ferry.capacity_pax,
                capacity_cars: ferry.capacity_cars
            })
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Ferry;
    }

    async updateFerry(ferryId: string, ferry: Partial<Ferry>): Promise<void> {
        // We use the standard update mechanism for ferries to support partial updates like is_active
        const { error } = await this.supabase
            .from('mnt_ferries')
            .update(ferry)
            .eq('id', ferryId)
            .eq('tenant_id', this.tenantId);

        if (error) throw error;
    }

    async deleteFerry(ferryId: string): Promise<void> {
        const { error } = await this.supabase.rpc('delete_ferry', {
            p_tenant_id: this.tenantId,
            p_ferry_id: ferryId
        });

        if (error) throw error;
    }
}
