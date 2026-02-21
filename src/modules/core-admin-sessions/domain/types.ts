export interface Session {
    id: string;
    tenantId: string;
    userId: string;
    expiresAt: string;
    revokedAt?: string;
    createdAt?: string; // If exists in DB, otherwise ignore
}

export interface ISessionRepository {
    getSessions(tenantId: string): Promise<Session[]>;
    revokeSession(tenantId: string, sessionId: string): Promise<void>;
}
