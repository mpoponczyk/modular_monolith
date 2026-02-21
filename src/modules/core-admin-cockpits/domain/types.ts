
export interface Cockpit {
    id: string;
    tenant_id: string;
    name: string;
    config_json: CockpitConfig;
    is_default: boolean;
    created_at?: string;
    updated_at?: string;
}

export type CockpitData = Cockpit;

export interface CockpitConfig {
    widgets: CockpitWidget[];
}

export interface CockpitWidget {
    id: string;
    type: 'chart' | 'table' | 'metric' | 'text';
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
    props?: Record<string, any>;
}

export interface CockpitRepository {
    getCockpits(tenantId: string): Promise<Cockpit[]>;
    upsertCockpit(tenantId: string, id: string | null, name: string, config: CockpitConfig): Promise<string>;
    deleteCockpit(tenantId: string, id: string): Promise<void>;
}
