// mateusz poponczyk
import { User } from '@supabase/supabase-js';
import { UserContext } from '@/core/types';
import { SupabaseUserRepository } from '@/infra/repositories/SupabaseUserRepository';
import { cache } from 'react';

export const getUserContext = cache(async (userId: string, tenantId: string): Promise<UserContext | null> => {
    if (!userId || !tenantId) {
        return null; // Fail if missing required inputs
    }

    const userRepo = new SupabaseUserRepository();

    try {
        const permissions = await userRepo.getUserPermissions(userId, tenantId);

        return {
            userId: userId,
            permissions
        };
    } catch (error) {
        console.error("Failed to resolve user context", error);
        return null;
    }
});
