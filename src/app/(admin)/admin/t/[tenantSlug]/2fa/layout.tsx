import { LegacyHeader } from "@/components/legacy/admin/LegacyHeader"
import { ReactNode } from "react"
import { createAuthClient } from "@/infra/supabase/server-auth"
import { SupabaseUserPreferenceRepository } from "@/infra/repositories/SupabaseUserPreferenceRepository"

import { getLocaleFromCookies } from "@/shared/i18n/server"

export default async function TwoFactorLayout({ children }: { children: ReactNode }) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch theme preference
    let initialTheme = 'system';
    if (user) {
        const repo = new SupabaseUserPreferenceRepository();
        const pref = await repo.getTheme(user.id);
        if (pref) initialTheme = pref;
    }

    const locale = await getLocaleFromCookies();

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <LegacyHeader user={user} initialTheme={initialTheme} initialLocale={locale} />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
    )
}
