/**
 * Root Admin Handler
 * 
 * Handles /admin and /admin/non-canonical-routes
 * 
 * Logic:
 * 1. Try Implicit Resolution (Cookie/Header/SingleTenant).
 * 2. If resolved -> Redirect to Canonical URL (/admin/t/[slug]).
 * 3. If not -> Redirect Login or Show 404 (Fail Closed).
 */

import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { redirect, notFound } from 'next/navigation';

interface AdminRootProps {
    params: Promise<{
        slug?: string[];
    }>;
}

export default async function AdminRootPage({ params }: AdminRootProps) {
    const { slug } = await params;

    // 1. Try to resolve implicit context
    const authContext = await resolveAuthContext();

    if (authContext) {
        // Implicit resolution worked!
        // Redirect to Canonical URL
        redirect(`/admin/t/${authContext.tenantContext.slug}`);
    }

    // Implicit resolution failed.
    // Use params to decide if 404 or Login.

    // If user is not logged in -> Login
    // But resolveAuthContext returns null if user is not logged in OR if tenant ambiguous.
    // We can't distinguish easily without separating calls.
    // But safely: Redirect to Login is usually fine if unauthenticated.
    // If authenticated but ambiguous -> Plan says "Select Tenant" (future) or 409.
    // For now, redirect to Login clears state or re-prompts.

    // However, if the user typed /admin/dashboard (legacy), 
    // params.slug matches. We should probably 404 if we want STRICT enforcement.

    if (slug?.length) {
        // User typed /admin/some-module but NOT /admin/t/...
        // Matches [[...slug]] at root.
        // STRICT: 404.
        notFound();
    }

    // Root /admin
    // If we are here, implicit failed.
    // Redirect to Login.
    redirect('/login');
}
