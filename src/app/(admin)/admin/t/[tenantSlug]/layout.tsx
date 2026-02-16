import { ReactNode } from 'react';
import { getMenuItems } from '@/core/menu';
import { AdminLayout as CoreLayout } from '@/core/layout/AdminLayout';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyTwoFaCookie } from '@/core/security/twofaCookie';
import { createAuthClient } from '@/infra/supabase/server-auth';

export default async function TenantLayout({
    children,
    params
}: {
    children: ReactNode;
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    // 0. Resolve Full Auth Context with explicit tenantSlug
    const authContext = await resolveAuthContext(tenantSlug);

    if (!authContext) {
        redirect('/login');
    }

    const { userContext, tenantContext } = authContext;

    // 1. Get Pathname (Avoid Loop)
    const { headers: headersList } = require('next/headers');
    const headerStore = await headersList();
    const pathname = headerStore.get('x-pathname') || '';

    // Check if we are already on 2FA page (or Actions)
    const is2FaPage = pathname.includes('/2fa');

    // 2. Strict Server-Side 2FA Truth Check (Layer 2)
    // Only perform check if NOT on 2FA page to avoid redirect loops.
    // Middleware handles basic validity. Here we check DB for rotation/revocation.
    if (!is2FaPage) {
        const cookieStore = await cookies();
        const twoFaCookie = cookieStore.get('2fa_session');
        let isValid = false;

        if (twoFaCookie) {
            const payload = verifyTwoFaCookie(twoFaCookie.value);
            // Ensure payload matches current tenant context
            if (payload && payload.tenantSlug === tenantSlug) {
                const supabase = createAuthClient();
                const { data: isSessionValid, error } = await supabase.rpc('validate_twofa_session', {
                    p_tenant_id: tenantContext.tenantId,
                    p_session_id: payload.sessionId
                });

                if (!error && isSessionValid) {
                    isValid = true;
                }
            }
        }

        // If invalid (revoked, expired, missing, or wrong tenant), redirect.
        if (!isValid) {
            redirect(`/admin/t/${tenantSlug}/2fa?reason=auth_check_failed`);
        }
    }

    // 3. Fetch Menu (Only reached if valid or on 2FA page)
    const menuItems = getMenuItems(tenantContext, userContext);

    return (
        <CoreLayout menuItems={menuItems}>
            {children}
        </CoreLayout>
    );
}
