// mateusz poponczyk
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTwoFaCookie } from '@/core/security/twofaCookie';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Strict Transport Gate: Admin Routes Only
    if (pathname.startsWith('/admin')) {

        // 2. Auth Session Check (Transport Heuristic)
        // We don't query DB, just check for Supabase token presence to fail fast.
        const authCookie = request.cookies.get('sb-auth-token') ||
            request.cookies.getAll().find(c => c.name.startsWith('sb-'));

        if (!authCookie) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        // 3. Tenant 2FA Gate
        // Regex to match /admin/t/[slug]/*
        const tenantMatch = pathname.match(/^\/admin\/t\/([^\/]+)/);

        if (tenantMatch) {
            const tenantSlug = tenantMatch[1];

            // Exclude the 2FA page itself from checks to avoid loop
            if (!pathname.startsWith(`/admin/t/${tenantSlug}/2fa`)) {

                // 3. Tenant 2FA Gate (Transport Heuristic)
                // Real DB Binding Check happens in: src/app/.../page.tsx -> requireTwoFaVerified
                const twoFaCookie = request.cookies.get('2fa_session');

                let isValid = false;

                if (twoFaCookie) {
                    const payload = await verifyTwoFaCookie(twoFaCookie.value);
                    if (payload && payload.tenantSlug === tenantSlug) {
                        isValid = true;
                    }
                }

                if (!isValid) {
                    const url = request.nextUrl.clone();
                    url.pathname = `/admin/t/${tenantSlug}/2fa`;
                    return NextResponse.redirect(url);
                }
            }
        }
    }

    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
}

export const config = {
    matcher: ['/admin/:path*'],
};
