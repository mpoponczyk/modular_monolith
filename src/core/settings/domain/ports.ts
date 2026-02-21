

import { SystemSettings, UpdateSettingsDTO } from "./types";
export type { SystemSettings, UpdateSettingsDTO };

export interface ISettingsRepository {
    findByTenant(tenantId: string): Promise<SystemSettings | null>;
    update(tenantId: string, settings: UpdateSettingsDTO): Promise<void>;
    initialize(tenantId: string): Promise<SystemSettings>;
}
