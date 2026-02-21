import { Suspense } from 'react';
import { verifyPageAccess } from '@/core/auth/actions';
import { listOrdersAction } from '../application/actions';
import { OrdersTable } from './orders-table';
import { Loader2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin-page-header';
import { getLocaleFromCookies } from '@/shared/i18n/server';

export default async function OrdersPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params;
    await verifyPageAccess(tenantSlug, 'orders.view');

    const orders = await listOrdersAction(tenantSlug);
    const locale = await getLocaleFromCookies();
    let dict;
    try {
        dict = (await import(`../i18n/${locale}.json`)).default;
    } catch (e) {
        dict = (await import(`../i18n/en.json`)).default;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
            <AdminPageHeader title={dict?.admin?.ordersPage?.title || "Orders"} description={dict?.admin?.ordersPage?.manageOrders || "Manage orders"} />
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>}>
                <OrdersTable tenantSlug={tenantSlug} orders={orders} dict={dict} />
            </Suspense>
        </div>
    );
}
