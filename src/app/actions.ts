'use server'

import { createAuthClient } from '@/infra/supabase/server-auth';
import { redirect } from 'next/navigation';

export async function signOutAction() {
    const supabase = createAuthClient();
    await supabase.auth.signOut();
    redirect('/login');
}
