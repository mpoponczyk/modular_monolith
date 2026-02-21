import { createAuthClient } from "@/infra/supabase/server-auth";
import { notFound, redirect, forbidden } from "next/navigation";
import { listCustomersAction } from "../application/actions";
import { getTenantContext } from "@/core/context/getTenantContext";
import { getUserContext } from "@/core/context/getUserContext";
import { SupabaseTenantRepository } from "@/infra/repositories/SupabaseTenantRepository";
import { CustomersContent } from "./customers-content";

interface PageProps {
    params: Promise<{
        tenantSlug: string;
    }>;
}

export default async function CustomersPage({ params }: PageProps) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { tenantSlug } = await params;
    const tenantRepo = new SupabaseTenantRepository();
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);

    if (!tenant) notFound();

    const [tenantContext, userContext] = await Promise.all([
        getTenantContext(tenant.id, tenant.slug),
        getUserContext(user.id, tenant.id)
    ]);

    if (!tenantContext || !userContext) redirect('/login');

    if (!userContext.permissions.includes('crm.view') && !userContext.permissions.includes('*')) {
        redirect(`/admin/t/${tenantSlug}/unauthorized`);
    }

    let customers: any[] = [];
    try {
        customers = await listCustomersAction(tenantSlug);
    } catch (e) {
        console.warn("Failed to fetch customers", e);
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <CustomersContent
                tenantSlug={tenantSlug}
                customers={customers}
            />
        </div>
    );
}
