
import { createAuthClient } from '@/infra/supabase/server-auth';
import { PlanningRepository, PlanningItem } from '../domain/types';

export class SupabasePlanningRepository implements PlanningRepository {
    async getItems(tenantId: string): Promise<PlanningItem[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase.rpc('get_planning_items', { p_tenant_id: tenantId });
        if (error) throw error;
        return data as PlanningItem[];
    }
}
