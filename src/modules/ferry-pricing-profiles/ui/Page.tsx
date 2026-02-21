import { listProfilesAction } from "../application/actions";
import PricingProfilesClient from "./PricingProfilesClient";
import { createAuthClient } from "@/infra/supabase/server-auth";
import { notFound, redirect } from "next/navigation";

export default async function PricingProfilesPage({
    params
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { tenantSlug } = await params;

    let profiles = [];
    try {
        profiles = await listProfilesAction(tenantSlug);
    } catch (e) {
        redirect(`/admin/t/${tenantSlug}/unauthorized`);
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Pricing Profiles</h1>
            <p className="text-gray-500 mb-6 font-light">Manage base pricing schemas for your tickets and vehicles.</p>
            <PricingProfilesClient tenantSlug={tenantSlug} initialProfiles={profiles} />
        </div>
    );
}
