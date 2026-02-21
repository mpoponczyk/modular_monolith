
import { createAuthClient } from "@/infra/supabase/server-auth";
import { SupabaseTenantRepository } from "@/infra/repositories/SupabaseTenantRepository";
import { SupabaseSettingsRepository } from "@/core/settings/infrastructure/SupabaseSettingsRepository";
import { notFound, redirect } from "next/navigation";
import { getUserContext } from "@/core/context/getUserContext";
import { getTenantContext } from "@/core/context/getTenantContext";
import { updateSystemSettingsAction } from "@/core/settings/actions";

interface PageProps {
    params: Promise<{
        tenantSlug: string;
    }>;
}

export default async function SettingsPage({ params }: PageProps) {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { tenantSlug } = await params;
    const tenantRepo = new SupabaseTenantRepository();
    const tenant = await tenantRepo.resolveTenantForUser(user.id, tenantSlug);

    if (!tenant) notFound();

    // Context & RBAC
    const [tenantContext, userContext] = await Promise.all([
        getTenantContext(tenant.id, tenant.slug),
        getUserContext(user.id, tenant.id)
    ]);

    if (!tenantContext || !userContext) redirect('/login');

    if (!userContext.permissions.includes('settings.view') && !userContext.permissions.includes('*')) {
        redirect('/admin/unauthorized');
    }

    // Fetch Data
    const settingsRepo = new SupabaseSettingsRepository(supabase);
    let settings = await settingsRepo.findByTenant(tenant.id);

    // Auto-initialize if missing
    if (!settings) {
        try {
            settings = await settingsRepo.initialize(tenant.id);
        } catch (e) {
            console.error("Failed to initialize settings", e);
            return <div>Error initializing settings.</div>;
        }
    }

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">System Settings</h1>
            <div className="bg-white rounded shadow p-6 text-black">
                <form action={updateSystemSettingsAction} className="space-y-4">
                    <input type="hidden" name="tenantSlug" value={tenantSlug} />

                    <div>
                        <label className="block text-sm font-medium mb-1">Theme</label>
                        <select name="theme" defaultValue={settings.theme} className="w-full border p-2 rounded">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Date Format</label>
                        <select name="dateFormat" defaultValue={settings.dateFormat} className="w-full border p-2 rounded">
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Currency</label>
                        <select name="currency" defaultValue={settings.currency} className="w-full border p-2 rounded">
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="PLN">PLN (zł)</option>
                        </select>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-2">Support Contact</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Support Phone</label>
                            <input
                                type="text"
                                name="supportPhone"
                                defaultValue={settings.supportPhone || ''}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
