
export interface PlanningItem {
    id: string;
    tenant_id: string;
    title: string;
    type: 'maintenance' | 'announcement' | 'holiday';
    start_at: string;
    end_at: string;
    description?: string;
}

export interface PlanningRepository {
    getItems(tenantId: string): Promise<PlanningItem[]>;
}
