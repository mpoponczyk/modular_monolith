// mateusz poponczyk
export interface IUserRepository {
    getUserPermissions(userId: string, tenantId: string): Promise<string[]>;
}
