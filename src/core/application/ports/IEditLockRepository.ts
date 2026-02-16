/**
 * Interface for Tenant-Scoped Edit Locks
 */
export interface IEditLockRepository {
    /**
     * Attempts to acquire a lock on an entity.
     * 
     * @param tenantId - Mandatory Tenant Context
     * @param entityType - Type discriminator
     * @param entityId - UUID of the entity
     * @param override - If true, attempts to steal lock (subject to RBAC)
     * 
     * @returns Object containing success status, current owner, and expiry.
     */
    acquireLock(
        tenantId: string,
        entityType: string,
        entityId: string,
        override?: boolean
    ): Promise<{ success: boolean; lockedBy?: string; expiresAt?: string }>;

    /**
     * Releases a lock if held by the user.
     * 
     * @param tenantId 
     * @param entityType 
     * @param entityId 
     */
    releaseLock(
        tenantId: string,
        entityType: string,
        entityId: string
    ): Promise<boolean>;
}
