import { createAuthClient } from '@/infra/supabase/server-auth';
import { cookies } from 'next/headers';

// Types aligning with RPC output
export interface MenuApp {
    app_id: string;
    module_id: string;
    title: string | null;
    description: string | null;
    order: number;
}

export interface MenuSection {
    id: string;
    title: string | null;
    apps: MenuApp[];
    base_order: number;
}

export type MenuStructure = MenuSection[];

export class MenuService {
    /**
     * Resolves the menu structure for the current user/context strictly via RPC.
     * @param tenantId - The validated Tenant ID from server context
     * @param orgId - The validated Organization ID from server context
     * @param languageCode - The requested language code (e.g. 'en', 'pl')
     * @param activeVariantId - Optional session-based variant override
     */
    static async getMenuForCurrentUser(
        tenantId: string,
        orgId: string,
        languageCode: string,
        activeVariantId?: string
    ): Promise<MenuStructure> {
        const supabase = createAuthClient();

        const params: any = {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_language_code: languageCode,
        };

        if (activeVariantId) {
            params.p_active_variant_id = activeVariantId;
        }

        const start = performance.now();
        const { data, error } = await supabase.rpc('resolve_menu_structure', params);
        console.log(`[Perf] MenuService RPC resolve_menu_structure: ${(performance.now() - start).toFixed(2)}ms`);

        if (error) {
            console.error('MenuService.getMenuForCurrentUser: RPC Error', error);
            // Fail-closed as per architectural contract (return empty)
            return [];
        }

        return (data as MenuStructure) || [];
    }

    /**
     * Sets the user's default variant preference.
     */
    static async setUserDefaultVariant(
        tenantId: string,
        orgId: string,
        variantId: string | null
    ): Promise<void> {
        const supabase = createAuthClient();

        const { error } = await supabase.rpc('set_user_variant_preference', {
            p_tenant_id: tenantId,
            p_org_id: orgId,
            p_variant_id: variantId
        });

        if (error) {
            console.error('MenuService.setUserDefaultVariant: RPC Error', error);
            throw new Error('Failed to set user variant preference');
        }
    }

    /**
     * Sets the active variant for the current session (via cookie).
     * This allows temporary overrides without changing user preferences.
     */
    static async setActiveVariant(variantId: string | null): Promise<void> {
        const cookieStore = await cookies();

        if (variantId) {
            cookieStore.set('active_variant_id', variantId, {
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax'
            });
        } else {
            cookieStore.delete('active_variant_id');
        }
    }
}
