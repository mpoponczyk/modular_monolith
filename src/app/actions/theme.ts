'use server';

import { cookies } from 'next/headers';
import { SupabaseUserPreferenceRepository } from '@/infra/repositories/SupabaseUserPreferenceRepository';
import { createAuthClient } from '@/infra/supabase/server-auth';
import { revalidatePath } from 'next/cache';

export async function setTheme(theme: 'light' | 'dark' | 'system') {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Persist to DB (Source of Truth)
    const repo = new SupabaseUserPreferenceRepository();
    await repo.setTheme(user.id, theme);

    // 2. Persist to Cookie (Hydration & Middleware)
    const cookieStore = await cookies();
    cookieStore.set('theme', theme, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    // 3. Revalidate to reflect change
    revalidatePath('/');
}
