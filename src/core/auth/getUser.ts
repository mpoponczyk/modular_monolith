import { createAuthClient } from '@/infra/supabase/server-auth';
import { User } from '@supabase/supabase-js';
import { cache } from 'react';

export const getUser = cache(async (): Promise<User | null> => {
    const supabase = createAuthClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        // console.error('[getUser] Supabase Auth Error:', error.message);
    }

    if (error || !user) {
        return null;
    }

    return user;
});
