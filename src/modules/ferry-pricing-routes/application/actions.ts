
'use server'

import { SupabaseFerryRouteRepository } from "@/modules/ferry-booking-routes/infrastructure/SupabaseFerryRouteRepository";
import { revalidatePath } from "next/cache";

import { verifyActionPermission } from '@/core/auth/actions';

export async function updateRoutePricing(tenantId: string, routeId: string, profileId: string | null) {
    await verifyActionPermission(tenantId, 'pricing.manage');
    const repo = new SupabaseFerryRouteRepository();

    try {
        await repo.update(tenantId, routeId, {
            defaultPriceProfileId: profileId
        });
        revalidatePath(`/admin/t/${tenantId}/apps/ferry-pricing/routes`);
    } catch (e) {
        console.error("Failed to update route pricing", e);
        throw new Error("Failed to update route pricing");
    }
}
