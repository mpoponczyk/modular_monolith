
import { ReactNode } from 'react';
import { createAuthClient } from '@/infra/supabase/server-auth';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    // 1. Strict Authentication Check
    const authClient = createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
        // User not authenticated -> Strictly redirect to Login
        redirect('/login');
    }

    // 2. Strict Tenant Context Resolution
    // At the root /admin layout, we attempt to resolve the context.
    // This handles implicit resolution (cookies/headers/single-membership).
    const authContext = await resolveAuthContext();

    if (!authContext) {
        // Authenticated but no valid tenant context (0 tenants or Ambiguous > 1)
        // Strictly render "No Tenant" state. DO NOT render children.
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        No Active Tenant
                    </h2>
                    <p className="text-gray-600">
                        You are authenticated, but we could not resolve an active Tenant context.
                        This may happen if you belong to no organizations, or if you have access to multiple and haven't selected one.
                    </p>
                    <div className="mt-6">
                        <form action={async () => {
                            'use server';
                            const client = createAuthClient();
                            await client.auth.signOut();
                            redirect('/login');
                        }}>
                            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // 3. User & Tenant Resolved -> Render Children
    return (
        <>
            {children}
        </>
    );
}
