import { LegacyLoginLayout } from '@/components/legacy/auth/LegacyLoginLayout';
import { createAuthClient } from '@/infra/supabase/server-auth';
import { redirect } from 'next/navigation';
import { getDictionary, getLocaleFromCookies } from '@/shared/i18n/server';
import { I18nProvider } from '@/shared/i18n/client';

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams;
    const error = searchParams?.error || null;

    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, 'auth');

    // 0. Auto-redirect if already logged in
    const supabaseCheck = createAuthClient();
    const { data: { user } } = await supabaseCheck.auth.getUser();

    if (user) {
        // Resolve tenants and route automatically
        const { data: tenants } = await supabaseCheck.rpc('resolve_user_tenants');
        if (tenants && tenants.length === 1) {
            return redirect(`/admin/t/${tenants[0].slug}`);
        } else if (tenants && tenants.length > 1) {
            return redirect('/admin/select-tenant');
        }
    }

    async function handleLogin(formData: FormData) {
        'use server';

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        // Use createAuthClient for cookie handling in Server Actions
        const supabase = createAuthClient();

        // 1. Authenticate with Supabase
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            return redirect(`/login?error=${encodeURIComponent(authError.message)}`);
        }

        // 2. Strict Tenant Resolution (RPC)
        const { data: tenants, error: rpcError } = await supabase.rpc('resolve_user_tenants');

        if (rpcError) {
            console.error('RPC Error:', rpcError);
            return redirect(`/login?error=${encodeURIComponent(rpcError.message || 'RPC Error')}`);
        }

        if (!tenants || tenants.length === 0) {
            await supabase.auth.signOut();
            return redirect(`/login?error=${encodeURIComponent('No active tenants found for this user.')}`);
        }

        // 3. Routing Logic
        if (tenants.length === 1) {
            // Exact one tenant -> Go to Dashboard
            return redirect(`/admin/t/${tenants[0].slug}`);
        } else {
            // Multiple tenants -> Go to Selection Page
            return redirect('/admin/select-tenant');
        }
    }

    return (
        <I18nProvider dict={dict}>
            <LegacyLoginLayout
                onLogin={handleLogin}
                error={error}
                initialLocale={locale}
            />
        </I18nProvider>
    );
}
