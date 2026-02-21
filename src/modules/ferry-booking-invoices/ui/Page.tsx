import { Suspense } from 'react';
import { verifyPageAccess } from '@/core/auth/actions';
import { getInvoicesAction } from '../application/actions';
import { InvoicesList } from './InvoicesList';
import { Loader2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin-page-header';
import { getLocaleFromCookies } from '@/shared/i18n/server';

export default async function InvoicesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params;
    const { tenantId } = await verifyPageAccess(tenantSlug, 'invoices.view');

    const invoices = await getInvoicesAction(tenantId);
    const locale = await getLocaleFromCookies();
    let dict;
    try {
        dict = (await import(`../i18n/${locale}.json`)).default;
    } catch (e) {
        dict = (await import(`../i18n/en.json`)).default;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <AdminPageHeader title={dict?.admin?.invoicesPage?.title || "Invoices"} description={dict?.admin?.invoicesPage?.manageInvoices || "Generate and download invoices for orders."} />
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>}>
                <InvoicesList tenantSlug={tenantSlug} invoices={invoices} dict={dict} />
            </Suspense>
        </div>
    );
}
