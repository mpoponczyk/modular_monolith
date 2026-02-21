
import { createAuthClient } from '@/infra/supabase/server-auth';
import { MenuItem } from '@/core/menu';
import { moduleRegistry } from '../moduleRegistry';

// Types covering the DB join result
// Note: RPC returns a nested JSON structure.
export async function getDynamicMenuItems(tenantId: string, tenantSlug: string, locale: string = 'en'): Promise<MenuItem[]> {
    const supabase = createAuthClient();

    try {
        // COMPLIANT FIX: Use Trusted RPC to bypass RLS recursion on company_users
        // The RPC 'resolve_menu_structure' is SECURITY DEFINER and checks tenant membership explicitely.
        const { data: sections, error } = await supabase.rpc('resolve_menu_structure', {
            p_tenant_id: tenantId,
            p_locale: locale
        });

        if (error) throw error;

        const menuItems: MenuItem[] = [];

        // Map RPC result to MenuItem[]
        // RPC returns: { id, order_index, is_enabled, name, items: [...] }
        (sections as any[])?.forEach((section) => {
            const sectionName = section.name || 'Unknown';
            const sectionItems = section.items || [];

            sectionItems.forEach((item: any) => {
                // Strict visibility check (redundant if RPC filters, but good for safety)
                if (!item.is_enabled || !item.is_active) return;

                const moduleId = item.module_id;
                const registryModule = moduleRegistry.getModule(moduleId);

                if (!registryModule) return;

                menuItems.push({
                    id: moduleId,
                    name: registryModule.name,
                    path: `/admin/t/${tenantSlug}/${moduleId}`,
                    order: item.order_index,
                    group: sectionName,
                });
            });
        });

        // Sort by order_index (global or per section? Logic implies flattened list sorted by DB order)
        // RPC sorts sections by order_index, and items by order_index within section.
        // We push them in order, so they are naturally sorted if we trust push order.
        // But the MenuItem interface flat list might need explicit sort if groups are interleaved?
        // Actually, AppLibraryPage groups by 'group' name.
        // So order within group matters.
        // Since we iterate sections in order, and items in order, the result `menuItems` is sorted by Section then Item.

        return menuItems;

    } catch (error) {
        console.error("Error fetching dynamic menu (RPC):", JSON.stringify(error, null, 2));
        return [];
    }
}
