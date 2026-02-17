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
    const authContext = await resolveAuthContext(tenantSlug);

    if (!authContext) {
        redirect('/login');
    }

    const { userContext, tenantContext } = authContext;

    // 1. Fetch User Details for Display (Separate from Auth Context)
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Fetch Menu
    const menuItems = getMenuItems(tenantContext, userContext);

    // Filter/Map items for Legacy Layout
    const sidebarItems = menuItems.map(m => ({
        id: m.id,
        name: m.name,
        // STRIP /admin prefix because LegacyAdminLayout PREPENDS /admin/t/[slug]
        path: m.path.replace(/^\/admin/, ''),
        order: m.order,
        group: m.group
    }));

    return (
        <LegacyAdminLayout
            sidebarItems={sidebarItems}
            tenantSlug={tenantSlug}
            user={{
                email: user?.email,
                full_name: user?.user_metadata?.full_name || user?.email // Fallback
            }}
            onLogout={signOutAction}
        >
            {children}
        </LegacyAdminLayout>
    );
}
