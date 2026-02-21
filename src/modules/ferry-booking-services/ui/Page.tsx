
import { Suspense } from 'react';
import { verifyPageAccess } from '@/core/auth/actions';
import ServiceList from './ServiceList';
import { getServicesAction } from '../application/actions';
import { Loader2 } from 'lucide-react';

import { getLocaleFromCookies } from '@/shared/i18n/server';
import { AdminPageHeader } from '@/components/admin-page-header';

export default async function ServicesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params;
    const { tenantId } = await verifyPageAccess(tenantSlug, 'services.view');

    // Load Local Module Dictionary
    const locale = await getLocaleFromCookies();
    const dict = await import(`../i18n/${locale}.json`).then(m => m.default).catch(() => import('../i18n/en.json').then(m => m.default));

    const services = await getServicesAction(tenantSlug);

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={dict.services?.title || "Services"}
                description={dict.services?.subtitle || "Manage Additional Services"}
            />
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" /></div>}>
                <ServiceList tenantSlug={tenantSlug} services={services} dict={dict} />
            </Suspense>
        </div>
    );
}
