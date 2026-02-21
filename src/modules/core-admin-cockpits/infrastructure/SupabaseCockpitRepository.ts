
import { createAuthClient } from '@/infra/supabase/server-auth';
import { CockpitRepository, CockpitData, Cockpit, CockpitConfig } from '../domain/types';

export class SupabaseCockpitRepository implements CockpitRepository {
    async getCockpits(tenantId: string): Promise<CockpitData[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase.rpc('get_cockpits', { p_tenant_id: tenantId });
        if (error) throw error;
        return data as Cockpit[];
    }

    async upsertCockpit(tenantId: string, id: string | null, name: string, config: CockpitConfig): Promise<string> {
        const supabase = createAuthClient();
        const { data, error } = await supabase.rpc('upsert_cockpit', {
            p_tenant_id: tenantId,
            p_id: id, // Null for new
            p_name: name,
            p_config_json: config
        });

        if (error) throw error;
        return data as string; // Returns UUID
    }

    async deleteCockpit(tenantId: string, id: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase
            .from('sys_cockpits')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    }
}
