'use server';

import { createAuthClient } from "@/infra/supabase/server-auth";
import { SupabaseTenantRepository } from "@/infra/repositories/SupabaseTenantRepository";
import { SupabaseSettingsRepository } from "@/core/settings/infrastructure/SupabaseSettingsRepository";
import { redirect } from "next/navigation";
import { getUserContext } from "@/core/context/getUserContext";
import { getTenantContext } from "@/core/context/getTenantContext";
import { revalidatePath } from "next/cache";

export async function updateSystemSettingsAction(formData: FormData) {
    const tenantSlug = formData.get('tenantSlug') as string;

    // Auth & Context
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const tenantRepo = new SupabaseTenantRepository();
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);
    if (!tenant) redirect("/login");

    const [tenantContext, userContext] = await Promise.all([
        getTenantContext(tenant.id, tenant.slug),
        getUserContext(user.id, tenant.id)
    ]);

    if (!tenantContext || !userContext) redirect('/login');

    if (!userContext.permissions.includes('settings.edit') && !userContext.permissions.includes('*')) {
        throw new Error("Unauthorized");
    }

    // Update
    const repo = new SupabaseSettingsRepository(supabase);
    await repo.update(tenant.id, {
        theme: formData.get('theme') as string,
        dateFormat: formData.get('dateFormat') as string,
        currency: formData.get('currency') as string,
        supportPhone: formData.get('supportPhone') as string
    });

    revalidatePath(`/admin/t/${tenantSlug}/settings`);
}
