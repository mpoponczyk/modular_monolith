import { createAuthClient } from "@/infra/supabase/server-auth";
import { SupabaseTenantRepository } from "@/infra/repositories/SupabaseTenantRepository";
import { listPartnersAction } from "../application/actions";
import { notFound, redirect } from "next/navigation";
import { getUserContext } from "@/core/context/getUserContext";
import { getTenantContext } from "@/core/context/getTenantContext";
import { PartnersContent } from "./partners-content";

interface PageProps {
    params: Promise<{
        tenantSlug: string;
    }>;
    searchParams: Promise<{ type?: string }>;
}

export default async function PartnersPage({ params, searchParams }: PageProps) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { tenantSlug } = await params;
    const { type } = await searchParams;
    const activeFilter = type || "SELLER";

    const tenantRepo = new SupabaseTenantRepository();
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);

    if (!tenant) notFound();

    // Context & RBAC
    const [tenantContext, userContext] = await Promise.all([
        getTenantContext(tenant.id, tenant.slug),
        getUserContext(user.id, tenant.id)
    ]);

    if (!tenantContext || !userContext) redirect('/login');

    if (!userContext.permissions.includes('crm.view') && !userContext.permissions.includes('*')) {
        redirect('/admin/unauthorized');
    }

    let partners: any[] = [];
    let errorMsg = null;

    try {
        const allPartners = await listPartnersAction(tenantSlug);

        if (activeFilter === "SELLER") {
            partners = allPartners.filter((p: any) => p.type === "SELLER" || p.type === "BOTH");
        } else if (activeFilter === "BUYER") {
            partners = allPartners.filter((p: any) => p.type === "BUYER" || p.type === "BOTH");
        } else {
            partners = allPartners;
        }
    } catch (e: any) {
        console.warn("Failed to fetch partners", e);
        errorMsg = "Wystąpił problem z pobieraniem partnerów.";
    }

    return (
        <div className="p-6">
            <PartnersContent
                tenantSlug={tenantSlug}
                partners={partners}
                activeFilter={activeFilter}
                errorMsg={errorMsg}
            />
        </div>
    );
}
