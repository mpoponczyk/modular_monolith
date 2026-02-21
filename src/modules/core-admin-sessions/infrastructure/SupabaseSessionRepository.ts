import { ISessionRepository } from '../domain/types';
import { Session } from '../domain/types';
import { createAuthClient } from '@/infra/supabase/server-auth';

function isSupabaseError(error: unknown): error is { message: string, code: string } {
    return typeof error === 'object' && error !== null && 'message' in error && 'code' in error;
}

export class SupabaseSessionRepository {
    async getSessions(tenantId: string, orgId?: string): Promise<Session[]> {
        const supabase = createAuthClient();

        // Use the new dual-scope RPC
        const { data, error } = await supabase.rpc('get_auth_sessions', {
            p_tenant_id: tenantId,
            p_org_id: orgId || null
        });

        if (error) {
            console.error("RPC Error:", error);
            throw new Error(`Failed to fetch sessions: ${error.message}`);
        }

        if (!data) return [];

        return data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            factorId: row.factor_id,
            aal: row.aal,
            notAfter: row.not_after,
            refreshedAt: row.refreshed_at,
            userAgent: row.user_agent,
            ip: row.ip,
            tag: row.tag,
            mfaAmrClaims: row.mfa_amr_claims,
            // Legacy mapping for UI compatibility
            last_heartbeat_at: row.updated_at,
            device_name: row.user_agent || 'Unknown Device',
            session_type: 'trusted',
            admin_profiles: {
                login: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email,
                email: row.email,
                is_active: row.is_active
            }
        }));
    }

    async revokeSession(tenantId: string, sessionId: string, orgId?: string): Promise<void> {
        const supabase = createAuthClient();

        const { error } = await supabase.rpc('revoke_auth_session', {
            p_tenant_id: tenantId,
            p_session_id: sessionId,
            p_org_id: orgId || null
        });

        if (error) {
            console.error("RPC Revoke Error:", error);
            throw new Error(`Failed to revoke session: ${error.message}`);
        }
    }

    async updateHeartbeat(userId: string): Promise<void> {
        // This is a global system action, no tenant boundary needed as it writes to public schema.
        const supabase = createAuthClient();

        // This fails silently if the record doesn't exist, which is fine for a heartbeat.
        const { error } = await supabase
            .from('sys_session_heartbeats')
            .upsert({ user_id: userId, last_active_at: new Date().toISOString() }, { onConflict: 'user_id' });

        if (error) {
            console.error("Heartbeat Error:", error);
        }
    }
}
