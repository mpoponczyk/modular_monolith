
// mateusz poponczyk
import TwoFactorForm from './TwoFactorForm';
import { getDictionary, getLocaleFromCookies } from '@/shared/i18n/server';
import { I18nProvider } from '@/shared/i18n/client';

export default async function TwoFactorPage(props: { params: Promise<{ tenantSlug: string }> }) {
    // Await params in Next.js 15+
    const params = await props.params;
    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, 'auth');

    return (
        <I18nProvider dict={dict}>
            <TwoFactorForm locale={locale} />
        </I18nProvider>
    );
}
