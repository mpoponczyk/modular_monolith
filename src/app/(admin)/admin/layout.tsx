import { ReactNode } from 'react';
import { createAuthClient } from '@/infra/supabase/server-auth';
import { getUser } from '@/core/auth/getUser';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { redirect } from 'next/navigation';
import { getDictionary, getLocaleFromCookies } from '@/shared/i18n/server';
import { I18nProvider } from '@/shared/i18n/client';

export default async function AdminLayout({
    children,
    params
}: {
    children: ReactNode;
    params: Promise<{ tenantSlug?: string }>;
}) {
    // 1. Strict Authentication Check
    const user = await getUser();

    if (!user) {
        // User not authenticated -> Strictly redirect to Login
        redirect('/login');
    }

    // 2. Strict Tenant Context Resolution
    const start = performance.now();
    const { tenantSlug } = await params;
    // console.log(`[AdminLayout] Resolving with Slug: ${tenantSlug}`);

    // fetch locale/dict for both paths (context success or failure)
    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, 'common'); // Common is enough for layout/error

    const authContext = await resolveAuthContext(tenantSlug);
    console.log(`[Perf] AdminLayout resolveAuthContext: ${(performance.now() - start).toFixed(2)}ms`);

    if (!authContext) {
        // Authenticated but no valid tenant context resolved.
        // Fetch available tenants to allow selection.
        const { SupabaseTenantRepository } = await import('@/infra/repositories/SupabaseTenantRepository');
        const repo = new SupabaseTenantRepository();
        const availableTenants = await repo.listUserTenants();

        return (
            <I18nProvider dict={dict}>
                <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
                    <div className="w-full max-w-md space-y-8">
                        {/* Select Organization UI */}
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                                Select Organization
                            </h2>
                            <p className="mt-2 text-gray-600">
                                Please select an organization to continue.
                            </p>
                        </div>

                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <ul className="divide-y divide-gray-200">
                                {availableTenants.map((t) => (
                                    <li key={t.id}>
                                        <a href={`/admin/t/${t.slug}/dashboard`} className="block hover:bg-gray-50 transition duration-150 ease-in-out">
                                            <div className="px-4 py-4 flex items-center sm:px-6">
                                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                                    <div className="truncate">
                                                        <div className="flex text-sm">
                                                            <p className="font-medium text-indigo-600 truncate">{t.name}</p>
                                                            <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                                                                ({t.slug})
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-5 flex-shrink-0">
                                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                                {availableTenants.length === 0 && (
                                    <li className="px-4 py-8 text-center text-gray-500 text-sm">
                                        No organizations found. Please contact support.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="text-center">
                            <form action={async () => {
                                'use server';
                                const client = createAuthClient();
                                await client.auth.signOut();
                                redirect('/login');
                            }}>
                                <button type="submit" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </I18nProvider>
        );
    }

    // 3. User & Tenant Resolved -> Render Children
    return (
        <I18nProvider dict={dict}>
            {children}
        </I18nProvider>
    );
}
