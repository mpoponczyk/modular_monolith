import { Suspense } from 'react';
import { verifyPageAccess } from '@/core/auth/actions';
import CockpitManager from './CockpitManager';
import { getCockpitsAction } from '../application/actions';
import { Loader2 } from 'lucide-react';

export default async function CockpitsPage({ params }: { params: { tenantSlug: string } }) {
    const { tenantId } = await verifyPageAccess(params.tenantSlug);

    const cockpits = await getCockpitsAction(tenantId);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Cockpit Painter</h1>
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" /></div>}>
                <CockpitManager tenantId={tenantId} cockpits={cockpits} />
            </Suspense>
        </div>
    );
}
