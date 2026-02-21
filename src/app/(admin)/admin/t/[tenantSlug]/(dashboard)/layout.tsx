
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
    const guardStart = performance.now();
    const user = authContext.user;

    // Check enrollment using the cached user object
    const factors = user?.factors || [];
    const is2FAEnrolled = factors.length > 0 && factors.some(f => f.status === 'verified');

    if (is2FAEnrolled) {
        // Only fetch session if 2FA is actually enrolled (rare case for admins, but needed for AAL checks)
        // If we strictly rely on the custom cookie, we might not even need getSession.
        // Let's check custom cookie first! It's zero network overhead.
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const twoFaToken = cookieStore.get('2fa_session')?.value;

        let isCustomVerified = false;
        if (twoFaToken) {
            const { verifyTwoFaCookie } = await import('@/core/security/twofaCookie');
            const payload = await verifyTwoFaCookie(twoFaToken);
            if (user && payload && payload.userId === user.id && payload.tenantSlug === tenantSlug) {
                isCustomVerified = true;
            }
        }

        if (!isCustomVerified) {
            // Check current session level from Supabase as fallback
            const supabase = createAuthClient();
            const { data: { session } } = await supabase.auth.getSession();
            const currentLevel = (session as any)?.aal || 'aal1';

            if (currentLevel !== 'aal2') {
                redirect(`/admin/t/${tenantSlug}/2fa`);
            }
        }
    }
    console.log(`[Perf] DashboardLayout 2FA Guard: ${(performance.now() - guardStart).toFixed(2)}ms`);

    // 2. Fetch Menu
    const mStart = performance.now();
    const menuItems = getMenuItems(tenantContext, userContext);
    console.log(`[Perf] DashboardLayout getMenuItems: ${(performance.now() - mStart).toFixed(2)}ms`);

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
    const pStart = performance.now();
    const { SupabaseUserPreferenceRepository } = await import('@/infra/repositories/SupabaseUserPreferenceRepository');
    const preferencesRepo = new SupabaseUserPreferenceRepository();
    let initialTheme = 'system';
    if (user) {
        initialTheme = await preferencesRepo.getTheme(user.id) || 'system';
    }
    console.log(`[Perf] DashboardLayout getTheme: ${(performance.now() - pStart).toFixed(2)}ms`);

    // 5. Fetch Translations for Sidebar
    const iStart = performance.now();
    const { getDictionary, getLocaleFromCookies } = await import('@/shared/i18n/server');
    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, 'common');
    console.log(`[Perf] DashboardLayout i18n: ${(performance.now() - iStart).toFixed(2)}ms`);

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
            initialLocale={locale}
            sidebarLabels={{
                appLibrary: (dict as any)?.sidebar?.app_library || 'App Library',
                dashboard: (dict as any)?.sidebar?.dashboard || 'Dashboard',
                close: (dict as any)?.cancel || 'Close'
            }}
        >
            {children}
        </HeaderAdminLayout>
    );
}
