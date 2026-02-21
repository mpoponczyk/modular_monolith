// mateusz poponczyk
import { Tenant } from "../../types";

export interface ITenantRepository {
    resolveTenantForUser(userId: string, tenantSlug?: string): Promise<Tenant | null>;
    getTenantModules(tenantId: string): Promise<string[]>;
    listUserTenants(): Promise<Tenant[]>;
}
