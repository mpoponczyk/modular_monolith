'use server';

import { verifyActionPermission } from '@/core/auth/actions';
import { SupabaseInvoiceRepository } from '../infrastructure/SupabaseInvoiceRepository';
import { Invoice } from '../domain/invoice-types';

const repository = new SupabaseInvoiceRepository();

export async function getInvoicesAction(tenantId: string): Promise<Invoice[]> {
    await verifyActionPermission(tenantId, 'invoices.view');
    return await repository.getInvoices(tenantId);
}

export async function generateInvoiceHtmlAction(tenantId: string, invoiceId: string): Promise<string> {
    await verifyActionPermission(tenantId, 'invoices.view');
    return await repository.generateInvoice(tenantId, invoiceId);
}

import { generateInvoicePDFBuffer } from '@/shared/utils/invoice-pdf';

export async function downloadInvoicePdfAction(tenantSlug: string, invoiceId: string) {
    try {
        const { createAuthClient } = await import('@/infra/supabase/server-auth');
        const supabase = createAuthClient();
        const { verifyTenantAccess } = await import('@/core/auth/access');
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'invoices.view');

        const { data: invoice, error } = await supabase
            .from('mnt_invoices')
            .select(`
                *,
                order:mnt_orders(
                    customer_first_name,
                    customer_last_name,
                    customer_email,
                    reservations:mnt_reservations(
                        count_passengers,
                        count_vehicles,
                        trip:mnt_trips(
                            departure_time,
                            ferry:mnt_ferries(name),
                            route:mnt_routes(origin:mnt_locations!mnt_routes_origin_fkey(name), destination:mnt_locations!mnt_routes_dest_fkey(name))
                        )
                    )
                )
            `)
            .eq('id', invoiceId)
            .eq('tenant_id', tenantId)
            .single();

        if (error || !invoice) throw new Error("Invoice not found");

        const order = invoice.order as any;
        const reservations = order?.reservations || [];

        const mockSummary = {
            id: invoice.invoice_number,
            currency: invoice.currency || 'PLN',
            customer_first_name: order?.customer_first_name || invoice.customer_name,
            customer_last_name: order?.customer_last_name || '',
            customer_email: order?.customer_email || 'No email',
            trip: {
                route: {
                    origin: { name: reservations.length > 1 ? 'Multiple Routes' : reservations[0]?.trip?.route?.origin?.name || 'Unknown' },
                    destination: { name: reservations.length > 1 ? 'See Details' : reservations[0]?.trip?.route?.destination?.name || 'Unknown' }
                },
                ferry: { name: reservations[0]?.trip?.ferry?.name || 'FerryPortal Fleet' },
                departure_time: reservations[0]?.trip?.departure_time || new Date().toISOString()
            },
            count_passengers: reservations.reduce((s: number, r: any) => s + (r.count_passengers || 0), 0) || 1,
            count_bikes: reservations.reduce((s: number, r: any) => s + (r.count_vehicles || 0), 0) || 0,
            count_pets: 0,
            total_amount: invoice.total_amount
        };

        const pdfBuffer = await generateInvoicePDFBuffer(mockSummary);

        return { success: true, pdfBase64: pdfBuffer.toString('base64'), filename: `Invoice_${invoice.invoice_number}.pdf` };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
