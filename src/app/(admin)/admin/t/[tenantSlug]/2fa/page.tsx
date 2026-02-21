
// mateusz poponczyk
import TwoFactorForm from './TwoFactorForm';
import { getDictionary, getLocaleFromCookies } from '@/shared/i18n/server';
import { I18nProvider } from '@/shared/i18n/client';

export default async function TwoFactorPage(props: { params: Promise<{ tenantSlug: string }> }) {
    // Await params in Next.js 15+
    const params = await props.params;
    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, 'auth');

    // 0. Auto-redirect if already 2FA verified
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const twoFaCookie = cookieStore.get('2fa_session');

    if (twoFaCookie) {
        const { verifyTwoFaCookie } = await import('@/core/security/twofaCookie');
        const payload = await verifyTwoFaCookie(twoFaCookie.value);
        if (payload && payload.tenantSlug === params.tenantSlug) {
            // Must verify against DB to prevent redirect loops on revoked sessions
            const { createAuthClient } = await import('@/infra/supabase/server-auth');
            const supabase = createAuthClient();
            const { data: isValid } = await supabase.rpc('validate_twofa_session', {
                p_tenant_id: payload.tenantId,
                p_session_id: payload.sessionId
            });

            if (isValid) {
                // Already strictly verified in DB, go to dashboard
                const { redirect } = await import('next/navigation');
                return redirect(`/admin/t/${params.tenantSlug}`);
            }
        }
    }

    return (
        <I18nProvider dict={dict}>
            <TwoFactorForm locale={locale} />
        </I18nProvider>
    );
}
