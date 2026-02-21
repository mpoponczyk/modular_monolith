

import { User, CreateUserDTO, UpdateUserDTO } from "./types";
export type { User, CreateUserDTO, UpdateUserDTO };

export interface IUserRepository {
    findByTenant(tenantId: string): Promise<User[]>;
    findById(tenantId: string, userId: string): Promise<User | null>;
    invite(tenantId: string, user: CreateUserDTO): Promise<string>;
    update(tenantId: string, userId: string, data: UpdateUserDTO): Promise<void>;
    remove(tenantId: string, userId: string): Promise<void>;
}
