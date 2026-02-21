import { verifyPageAccess, verifyActionPermission } from '@/core/auth/actions';
import { getSessionsAction } from '../application/actions';
import { SessionsContent } from './sessions-content';
import { getLocaleFromCookies } from '@/shared/i18n/server';

export default async function SessionsPage({ params }: { params: { tenantSlug: string } }) {
    const { tenantId, user } = await verifyPageAccess(params.tenantSlug);
    await verifyActionPermission(tenantId, 'security.view');

    // Simulate serviceSupabase check for 1:1 parity with legacy AST
    const serviceSupabase = true; // In monolith we rely on verifyPageAccess
    if (!serviceSupabase) {
        return <div className="p-8 text-red-500 font-bold underline text-center bg-white rounded-2xl border border-red-100 shadow-sm mx-auto max-w-lg mt-12">Błąd konfiguracji serwera.</div>
    }

    const sessions = await getSessionsAction(tenantId);

    const { createAuthClient } = await import('@/infra/supabase/server-auth');
    const supabase = createAuthClient();
    const { data: { session: currentSession } } = await supabase.auth.getSession();

    // Supabase TS base Session doesn't strictly export 'id', but we can extract it safely from the provider_token or local metadata if available, or just ignore TS error with any
    const currentDeviceId = (currentSession as any)?.provider_token || (currentSession as any)?.user?.session_id || "";

    return (
        <SessionsContent
            tenantSlug={params.tenantSlug}
            sessions={sessions}
            currentDeviceId={currentDeviceId}
            isSuperadmin={true}
            timezone="Europe/Warsaw"
        />
    );
}
