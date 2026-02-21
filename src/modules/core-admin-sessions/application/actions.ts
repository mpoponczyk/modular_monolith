'use server';

import { verifyActionPermission } from '@/core/auth/actions';
import { SupabaseSessionRepository } from '../infrastructure/SupabaseSessionRepository';
import { Session } from '../domain/types';
import { ForbiddenError } from '@/core/errors';

export async function getSessionsAction(tenantId: string, orgId?: string): Promise<Session[]> {
    // PRE-FLIGHT GATE: Dual-Scope Check
    let hasTenantManage = false;
    let hasOrgManage = false;

    try {
        await verifyActionPermission(tenantId, 'sessions.manage.tenant');
        hasTenantManage = true;
    } catch {
        // Fallback to org manage
        try {
            await verifyActionPermission(tenantId, 'sessions.manage.org');
            hasOrgManage = true;
        } catch {
            // Neither capability exists
        }
    }

    if (!hasTenantManage && !hasOrgManage) {
        // Fallback to legacy check just in case, or throw
        try {
            await verifyActionPermission(tenantId, 'security.view');
            hasTenantManage = true;
        } catch {
            throw new ForbiddenError('Missing required permission to manage sessions.');
        }
    }

    // Dual Scope Routing
    const repo = new SupabaseSessionRepository();
    if (hasTenantManage) {
        return await repo.getSessions(tenantId);
    } else {
        if (!orgId) throw new ForbiddenError('Organization context required for org-level session management.');
        return await repo.getSessions(tenantId, orgId);
    }
}

export async function revokeSessionAction(tenantSlug: string, deviceId: string, orgId?: string): Promise<{ success: boolean, error?: string }> {
    try {
        const { createAuthClient } = await import('@/infra/supabase/server-auth');
        const supabase = createAuthClient();

        // We still need tenantId. We could use verifyTenantAccess
        const { verifyTenantAccess } = await import('@/core/auth/access');
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug); // Base access

        // PRE-FLIGHT GATE
        let hasTenantManage = false;
        let hasOrgManage = false;

        try {
            await verifyActionPermission(tenantId, 'sessions.manage.tenant');
            hasTenantManage = true;
        } catch {
            try {
                await verifyActionPermission(tenantId, 'sessions.manage.org');
                hasOrgManage = true;
            } catch {
                try {
                    await verifyActionPermission(tenantId, 'security.manage');
                    hasTenantManage = true;
                } catch {
                    throw new ForbiddenError('Missing required permission to revoke sessions.');
                }
            }
        }

        const repo = new SupabaseSessionRepository();
        if (hasTenantManage) {
            await repo.revokeSession(tenantId, deviceId);
        } else {
            if (!orgId) throw new ForbiddenError('Organization context required.');
            await repo.revokeSession(tenantId, deviceId, orgId);
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateHeartbeatAction(): Promise<{ success: boolean }> {
    try {
        const { createAuthClient } = await import('@/infra/supabase/server-auth');
        const supabase = createAuthClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error("Unauthorized");

        const repo = new SupabaseSessionRepository();
        await repo.updateHeartbeat(user.id);
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
