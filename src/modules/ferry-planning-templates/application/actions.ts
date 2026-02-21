'use server'

import { createAuthClient } from "@/infra/supabase/server-auth"
import { revalidatePath } from "next/cache"
import { verifyTenantAccess } from "@/core/auth/access";
import { SupabaseTemplateService } from '../infrastructure/SupabaseTemplateService';

export async function createTemplate(formData: FormData) {
    const supabase = createAuthClient();
    const tenantSlug = formData.get("tenantSlug") as string;
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.manage');

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const service = new SupabaseTemplateService();
    await service.createTemplate(tenantId, name, description);

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-planning/templates`);
}

export async function deleteTemplate(tenantSlug: string, id: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.manage');

    const service = new SupabaseTemplateService();
    await service.deleteTemplate(tenantId, id);

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-planning/templates`);
}

export async function addItemToTemplate(templateId: string, formData: FormData) {
    const supabase = createAuthClient();
    const tenantSlug = formData.get("tenantSlug") as string;
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.manage');

    const routeId = formData.get("route_id") as string;
    const departureTime = formData.get("departure_time") as string;

    const service = new SupabaseTemplateService();
    await service.addItemToTemplate(tenantId, templateId, routeId, departureTime);

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-planning/templates`);
}

export async function deleteTemplateItem(tenantSlug: string, itemId: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.manage');

    const service = new SupabaseTemplateService();
    await service.deleteTemplateItem(tenantId, itemId);

    revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-planning/templates`);
}
