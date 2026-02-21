

import { Role, CreateRoleDTO, UpdateRoleDTO } from "./types";
export type { Role, CreateRoleDTO, UpdateRoleDTO };

export interface IRoleRepository {
    findByTenant(tenantId: string): Promise<Role[]>;
    findById(tenantId: string, roleId: string): Promise<Role | null>;
    create(tenantId: string, role: CreateRoleDTO): Promise<string>;
    update(tenantId: string, roleId: string, data: UpdateRoleDTO): Promise<void>;
    delete(tenantId: string, roleId: string): Promise<void>;
}
