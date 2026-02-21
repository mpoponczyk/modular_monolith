
import { createAuthClient } from '@/infra/supabase/server-auth';
import { InvoiceRepository, Invoice } from '../domain/invoice-types';

export class SupabaseInvoiceRepository implements InvoiceRepository {
    async getInvoices(tenantId: string): Promise<Invoice[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_invoices')
            .select(`
                *,
                order:mnt_orders(
                    customer_email,
                    reservations:mnt_reservations(
                        trip:mnt_trips(route:mnt_routes(origin:mnt_locations!mnt_routes_origin_fkey(name), destination:mnt_locations!mnt_routes_dest_fkey(name)))
                    )
                )
            `)
            .eq('tenant_id', tenantId)
            .order('issue_date', { ascending: false });

        if (error) throw error;
        return data as unknown as Invoice[];
    }

    async generateInvoice(tenantId: string, invoiceId: string): Promise<string> {
        // Mock generation for parity - in real app would use strict template engine
        // Fetch invoice details first to be strict
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('mnt_invoices')
            .select('*')
            .eq('id', invoiceId)
            .eq('tenant_id', tenantId) // Strict Scope
            .single();

        if (error || !data) throw new Error('Invoice not found');

        const invoice = data as Invoice;

        return `
            <html>
            <head><title>Invoice ${invoice.invoice_number}</title></head>
            <body style="font-family: sans-serif; padding: 40px;">
                <h1>INVOICE</h1>
                <p><strong>Ref:</strong> ${invoice.invoice_number}</p>
                <p><strong>Customer:</strong> ${invoice.customer_name}</p>
                <p><strong>Date:</strong> ${invoice.issue_date}</p>
                <hr/>
                <h2>Total: ${invoice.total_amount} ${invoice.currency}</h2>
                <p>Status: ${invoice.status}</p>
            </body>
            </html>
        `;
    }
}
