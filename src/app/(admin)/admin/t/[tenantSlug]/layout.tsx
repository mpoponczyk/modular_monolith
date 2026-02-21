// mateusz poponczyk
import { ReactNode } from 'react';
import { getMenuItems } from '@/core/menu';
import { LegacyAdminLayout } from '@/components/legacy/admin/LegacyAdminLayout';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/app/actions';
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
    const start = performance.now();
    const authContext = await resolveAuthContext(tenantSlug);
    console.log(`[Perf] TenantLayout resolveAuthContext: ${(performance.now() - start).toFixed(2)}ms`);

    if (!authContext) {
        // Strict Check: Is it Auth Failure or Tenant Failure?
        const { getSession } = await import('@/core/auth/getSession');
        const session = await getSession();

        if (session) {
            // User is logged in, but Context failed (Tenant not found or Access Denied)
            // STRICT: 404 (Security by Obscurity)
            const { notFound } = await import('next/navigation');
            notFound();
        }

        redirect('/login');
    }

    const { userContext, tenantContext } = authContext;

    // 1. Fetch User Details for Display (Separate from Auth Context)
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 3. User & Tenant Resolved -> Render Children
    // UI (Sidebar/Header) is handled in sub-layouts (e.g. (dashboard)/layout.tsx)
    // to strictly allow standalone pages like 2FA without menu leakage.
    return (
        <>
            {children}
        </>
    );
}
