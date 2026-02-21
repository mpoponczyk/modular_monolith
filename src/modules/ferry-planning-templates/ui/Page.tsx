import { createAuthClient } from "@/infra/supabase/server-auth";
import { notFound, redirect } from "next/navigation";
import { verifyTenantAccess } from "@/core/auth/access";
import { SupabaseTemplateService } from '../infrastructure/SupabaseTemplateService';
import { TemplatesContent } from "./templates-content";

interface PageProps {
    params: Promise<{
        tenantSlug: string;
    }>;
}

export default async function TemplatesPage({ params }: PageProps) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { tenantSlug } = await params;

    let tenantIdStr = "";
    try {
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'planning.view');
        tenantIdStr = tenantId;
    } catch {
        redirect(`/admin/t/${tenantSlug}/unauthorized`);
    }

    const service = new SupabaseTemplateService();

    let templates: any[] = [];
    let routes: any[] = [];
    try {
        [templates, routes] = await Promise.all([
            service.getTemplatesWithItems(tenantIdStr),
            service.getRoutesForDropdown(tenantIdStr)
        ]);
    } catch (e) {
        console.error("Failed to fetch template data", e);
    }

    return <TemplatesContent tenantSlug={tenantSlug} templates={templates} routes={routes} />;
}
