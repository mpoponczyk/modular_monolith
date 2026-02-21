import { verifyPageAccess } from '@/core/auth/actions';
import { getTenantSettingsAction } from '../application/actions';
import { SettingsContent } from './settings-content';

export default async function SettingsPage({ params }: { params: { tenantSlug: string } }) {
    const { tenantId, user } = await verifyPageAccess(params.tenantSlug, 'settings.view');
    const settings = await getTenantSettingsAction(tenantId);

    return (
        <SettingsContent
            tenantSlug={params.tenantSlug}
            initialEmailEnabled={settings.email_enabled ?? false}
            initialTimezone={settings.default_timezone ?? "Europe/Warsaw"}
            initialHeatmapConfig={settings.heatmap_config || []}
            profile={user || {}}
        />
    )
}
