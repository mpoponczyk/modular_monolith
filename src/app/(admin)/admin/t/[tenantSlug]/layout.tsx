import { ReactNode } from 'react';
import { getMenuItems } from '@/core/menu';
import { AdminLayout as CoreLayout } from '@/core/layout/AdminLayout';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { redirect } from 'next/navigation';

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
        // If we can't resolve context for this slug -> Redirect Login
        // Or could be 404 if slug is invalid but user is logged in.
        // Assuming resolveAuthContext fails if slug doesn't match available tenants.
        redirect('/login');
    }

    const { userContext, tenantContext } = authContext;

    // 1. Fetch Menu (Pure Logic)
    const menuItems = getMenuItems(tenantContext, userContext);

    // 2. Render Core Layout (Pure UI)
    return (
        <CoreLayout menuItems={menuItems}>
            {children}
        </CoreLayout>
    );
}
