// mateusz poponczyk
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { createAuthClient } from '@/infra/supabase/server-auth';
import { ResendEmailService } from '@/infra/email/ResendEmailService';
import { signTwoFaCookie } from '@/core/security/twofaCookie';

// Helper to get infra service (Dependency Injection style)
const emailService = new ResendEmailService();

export async function requestChallenge(tenantSlug: string, locale: string = 'en') {
    const auth = await resolveAuthContext(tenantSlug);
    if (!auth) redirect('/login');

    const { user, tenantContext } = auth;
    const tenantId = tenantContext.tenantId;

    const supabase = createAuthClient();

    // Call RPC: create_login_challenge
    // Security Definer: Checks membership, returns code
    const { data: code, error } = await supabase.rpc('create_login_challenge', {
        p_tenant_id: tenantId
    });

    if (error) {
        console.error('Error creating challenge:', error);
        throw new Error('Failed to create login challenge');
    }

    // Send Email via Infra
    if (user.email && code) {
        await emailService.sendLoginChallenge(user.email, tenantSlug, code as string, locale);
    }
}

export async function verifyChallenge(tenantSlug: string, code: string) {
    const auth = await resolveAuthContext(tenantSlug);
    if (!auth) redirect('/login');

    const { user, tenantContext } = auth;
    const tenantId = tenantContext.tenantId;

    const supabase = createAuthClient();

    // Call RPC: verify_login_challenge
    // Security Definer: Verifies hash, Rotates Session, Returns Session ID
    const { data: sessionId, error } = await supabase.rpc('verify_login_challenge', {
        p_tenant_id: tenantId,
        p_code: code
    });

    if (error || !sessionId) {
        console.error('Error verifying challenge:', error);
        throw new Error('Invalid code or expired challenge');
    }

    // Generate Signed Cookie Payload
    // Variant A: Include tenantSlug for Middleware Binding
    const payload = {
        tenantId: tenantId,
        tenantSlug,
        userId: user.id,
        sessionId: sessionId as string,
        exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 hours
        iat: Math.floor(Date.now() / 1000)
    };

    const signedToken = await signTwoFaCookie(payload);

    // Set Cookie
    // Strict: __Host- prefix if Secure/Path=/ (but path is /admin mostly)
    // Let's use 2fa_session with strict flags
    const cookieStore = await cookies();
    cookieStore.set('2fa_session', signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/admin', // Scope to admin
        maxAge: 12 * 60 * 60 // 12 hours
    });

    // Return success and redirect URL allow client content to handle navigation
    return { success: true, redirectUrl: `/admin/t/${tenantSlug}` };
}
