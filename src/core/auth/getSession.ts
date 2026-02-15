import { createAuthClient } from '@/infra/supabase/server-auth';
import { Session } from '@supabase/supabase-js';

export async function getSession(): Promise<Session | null> {
    const supabase = createAuthClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        return null;
    }

    return session;
}
