// mateusz poponczyk
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createAuthClient(orgId?: string) {
    const defaultHeaders = orgId ? { 'x-org-id': orgId } : undefined;
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: defaultHeaders
            },
            cookies: {
                async getAll() {
                    const cookieStore = await cookies()
                    const all = cookieStore.getAll()
                    return all
                },
                async setAll(cookiesToSet) {
                    const cookieStore = await cookies()
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignored if called from a Server Component context mapping.
                    }
                },
            },
        }
    )
}
