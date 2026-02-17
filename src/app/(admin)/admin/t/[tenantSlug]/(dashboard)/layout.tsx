
// mateusz poponczyk
import { ReactNode } from 'react';
import { getMenuItems } from '@/core/menu';
import { HeaderAdminLayout } from '@/components/legacy/admin/HeaderAdminLayout';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/app/actions';
import { createAuthClient } from '@/infra/supabase/server-auth';

export default async function DashboardLayout({
    children,
    params
}: {
    children: ReactNode;
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    // 0. Resolve Full Auth Context
    const authContext = await resolveAuthContext(tenantSlug);
    if (!authContext) {
        redirect('/login');
    }
    const { userContext, tenantContext } = authContext;

    // 1. Strict 2FA Guard
    // If user has 2FA enabled (factors > 0), they MUST be at AAL2.
    // If not, redirect to 2FA page.
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check enrollment
    const factors = user?.factors || [];
    const is2FAEnrolled = factors.length > 0 && factors.some(f => f.status === 'verified');

    if (is2FAEnrolled) {
        // Check current session level
        const { data: { session } } = await supabase.auth.getSession();

        // Supabase session usually has 'aal' property in recent versions, 
        // fallback to checking amr if needed, but aal is standard in types now.
        // If strict type check fails, we cast or check amr.
        const currentLevel = (session as any)?.aal || 'aal1';

        // Or verify via amr:
        // const amr = session?.user?.amr || [];
        // const isAal2 = amr.some(a => a.method === 'totp' || a.method === 'phone');

        if (currentLevel !== 'aal2') {
            // Check for Custom 2FA Cookie (Strict Fallback for Custom Implementation)
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const twoFaToken = cookieStore.get('2fa_session')?.value;

            let isCustomVerified = false;
            if (twoFaToken) {
                const { verifyTwoFaCookie } = await import('@/core/security/twofaCookie');
                const payload = await verifyTwoFaCookie(twoFaToken);
                // Strict: Must match current user and tenant
                if (payload && payload.userId === user.id && payload.tenantSlug === tenantSlug) {
                    isCustomVerified = true;
                }
            }

            if (!isCustomVerified) {
                // 2FA Required but not verified -> Redirect to 2FA page
                // This page is OUTSIDE the (dashboard) layout, so it won't loop.
                redirect(`/admin/t/${tenantSlug}/2fa`);
            }
        }
    }

    // 2. Fetch Menu
    const menuItems = getMenuItems(tenantContext, userContext);

    // 3. Transform for Layout
    const headerItems = menuItems.map(m => ({
        id: m.id,
        name: m.name,
        // STRIP /admin prefix to match Layout expectation
        path: m.path.replace(/^\/admin/, ''),
        order: m.order,
        group: m.group
    }));

    // 4. Fetch User Preferences (Theme)
    const { SupabaseUserPreferenceRepository } = await import('@/infra/repositories/SupabaseUserPreferenceRepository');
    const preferencesRepo = new SupabaseUserPreferenceRepository();
    let initialTheme = 'system';
    if (user) {
        initialTheme = await preferencesRepo.getTheme(user.id) || 'system';
    }

    // 5. Fetch Translations for Sidebar
    const { getDictionary, getLocaleFromCookies } = await import('@/shared/i18n/server');
    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, 'common');

    // 6. Render Header Layout
    return (
        <HeaderAdminLayout
            menuItems={headerItems}
            tenantSlug={tenantSlug}
            user={{
                email: user?.email,
                full_name: user?.user_metadata?.full_name || user?.email
            }}
            onLogout={signOutAction}
            initialTheme={initialTheme}
            sidebarLabels={{
                appLibrary: dict['sidebar.app_library'] || 'App Library',
                dashboard: dict['sidebar.dashboard'] || 'Dashboard',
                close: dict['cancel'] || 'Close'
            }}
        >
            {children}
        </HeaderAdminLayout>
    );
}
