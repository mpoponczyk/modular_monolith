// mateusz poponczyk
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

    // Check if we are already on 2FA page
    // (Middleware handles transport gate, Page handles strict DB check)
    // Layout focuses on Menu composition.

    // 3. Fetch Menu (Only reached if valid or on 2FA page)
    const menuItems = getMenuItems(tenantContext, userContext);

    return (
        <CoreLayout menuItems={menuItems}>
            {children}
        </CoreLayout>
    );
}
