import { IUserPreferenceRepository } from '@/core/ports/IUserPreferenceRepository';
import { createAuthClient } from '@/infra/supabase/server-auth';

export class SupabaseUserPreferenceRepository implements IUserPreferenceRepository {
    async getTheme(userId: string): Promise<string | null> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('user_preferences')
            .select('theme')
            .eq('user_id', userId)
            .single();

        if (error || !data) return null;
        return data.theme;
    }

    async setTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase
            .from('user_preferences')
            .upsert({ user_id: userId, theme, updated_at: new Date().toISOString() })
            .select(); // returns data to confirm, redundant but good for debug

        if (error) {
            console.error('Failed to set theme:', error);
            throw new Error('Failed to update user preference');
        }
    }
}
