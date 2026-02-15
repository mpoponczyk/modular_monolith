import { User } from '@supabase/supabase-js';
import { UserContext } from '@/core/types';
import { SupabaseUserRepository } from '@/infra/repositories/SupabaseUserRepository';

export async function getUserContext(user: User, tenantId: string): Promise<UserContext | null> {
    if (!user || !tenantId) {
        return null; // Fail if missing required inputs
    }

    const userRepo = new SupabaseUserRepository();

    try {
        const permissions = await userRepo.getUserPermissions(user.id, tenantId);

        return {
            userId: user.id,
            permissions
        };
    } catch (error) {
        console.error("Failed to resolve user context", error);
        return null;
    }
}
