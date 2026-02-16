// mateusz poponczyk
import { createAuthClient } from '@/infra/supabase/server-auth';
import { IEditLockRepository } from '@/core/application/ports/IEditLockRepository';

export class SupabaseEditLockRepository implements IEditLockRepository {
    async acquireLock(
        tenantId: string,
        entityType: string,
        entityId: string,
        override: boolean = false
    ): Promise<{ success: boolean; lockedBy?: string; expiresAt?: string }> {
        if (!tenantId) throw new Error("TenantID is mandatory");

        const supabase = createAuthClient();

        const { data, error } = await supabase.rpc('acquire_edit_lock', {
            p_tenant_id: tenantId,
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_override: override
            // p_ttl_seconds uses default
        });

        if (error) {
            // Fail Closed
            throw new Error(`Failed to acquire lock: ${error.message}`);
        }

        // rpc returns an array of rows (table return type) or single object if .single() used?
        // client usually infers. Let's assume array of 1 since it's `returns table`.

        let result: any = data;
        if (Array.isArray(data)) {
            result = data[0];
        }

        if (!result) {
            throw new Error("Invalid RPC response");
        }

        return {
            success: result.success,
            lockedBy: result.locked_by,
            expiresAt: result.expires_at
        };
    }

    async releaseLock(
        tenantId: string,
        entityType: string,
        entityId: string
    ): Promise<boolean> {
        if (!tenantId) throw new Error("TenantID is mandatory");

        const supabase = createAuthClient();

        const { data, error } = await supabase.rpc('release_edit_lock', {
            p_tenant_id: tenantId,
            p_entity_type: entityType,
            p_entity_id: entityId
        });

        if (error) {
            throw new Error(`Failed to release lock: ${error.message}`);
        }

        return !!data;
    }
}
