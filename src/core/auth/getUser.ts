// mateusz poponczyk
import { createAuthClient } from '@/infra/supabase/server-auth';
import { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
    const supabase = createAuthClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}
