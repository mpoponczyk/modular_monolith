// mateusz poponczyk
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyTwoFaCookie } from './twofaCookie';
import { createAuthClient } from '@/infra/supabase/server-auth';

/**
 * Enforces strict 2FA validation for the current request.
 * 
 * Logic:
 * 1. Reads '2fa_session' cookie.
 * 2. Cryptographically verifies signature (Hex/HMAC).
 * 3. Checks payload constraints (Tenant binding, Expiry).
 * 4. DB CHECK: Validates session against 'twofa_sessions' table to catch revocation.
 * 
 * Failure Strategy:
 * - Redirects to /admin/t/[slug]/2fa
 */
export async function requireTwoFaVerified(tenantSlug: string, requiredTenantId: string) {
    const cookieStore = await cookies();
    const twoFaCookie = cookieStore.get('2fa_session');

    if (!twoFaCookie) {
        redirect(`/admin/t/${tenantSlug}/2fa?reason=missing_cookie`);
    }

    // 1. Crypto Verification
    const payload = await verifyTwoFaCookie(twoFaCookie.value);

    if (!payload) {
        redirect(`/admin/t/${tenantSlug}/2fa?reason=invalid_signature`);
    }

    // 2. Strict Tenant Binding Check (UUID)
    if (payload.tenantId !== requiredTenantId) {
        // Cross-tenant attempt detected
        redirect(`/admin/t/${tenantSlug}/2fa?reason=tenant_mismatch`);
    }

    // 3. DB Truth Check (Replay Protection)
    const supabase = createAuthClient();
    const { data: isValid, error } = await supabase.rpc('validate_twofa_session', {
        p_tenant_id: requiredTenantId,
        p_session_id: payload.sessionId
    });

    if (error || !isValid) {
        redirect(`/admin/t/${tenantSlug}/2fa?reason=session_revoked`);
    }

    return payload;
}
