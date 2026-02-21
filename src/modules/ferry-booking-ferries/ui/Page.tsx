import { Suspense } from 'react';
import { verifyPageAccess } from '@/core/auth/actions';
import { listFerriesAction } from '../application/actions';
import FerriesList from './FerriesList';
import { Loader2 } from 'lucide-react';
import { getLocaleFromCookies } from '@/shared/i18n/server';

export default async function FerriesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params;
    const { tenantId } = await verifyPageAccess(tenantSlug, 'ferries.view');

    // Load Local Module Dictionary
    const locale = await getLocaleFromCookies();
    const dict = await import(`../i18n/${locale}.json`).then(m => m.default).catch(() => import('../i18n/en.json').then(m => m.default));

    const ferries = await listFerriesAction(tenantSlug);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>}>
                <FerriesList ferries={ferries} dict={dict} />
            </Suspense>
        </div>
    );
}
