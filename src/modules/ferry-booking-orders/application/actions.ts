
'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { SupabaseOrderRepository } from '../infrastructure/SupabaseOrderRepository';
import { verifyTenantAccess } from '@/core/auth/access';

export async function listOrdersAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'orders.view');

    const repo = new SupabaseOrderRepository(supabase);
    return await repo.findAll(tenantId);
}

export async function getOrderDetailsAction(tenantSlug: string, orderId: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'orders.view');

    const repo = new SupabaseOrderRepository(supabase);
    return await repo.findById(tenantId, orderId);
}

import { revalidatePath } from 'next/cache';
import { generateInvoicePDFBuffer } from '@/shared/utils/invoice-pdf';

export async function cancelOrderAction(tenantSlug: string, orderId: string) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'orders.manage');

        // 1. Update Order Status
        const { error: orderError } = await supabase
            .from("mnt_orders")
            .update({ status: 'CANCELLED', payment_status: 'REFUNDED' })
            .eq('id', orderId)
            .eq('tenant_id', tenantId);

        if (orderError) throw orderError;

        // 2. Update linked Reservations
        const { error: resError } = await supabase
            .from("mnt_reservations")
            .update({ status: 'CANCELLED' })
            .eq('order_id', orderId)
            .eq('tenant_id', tenantId);

        if (resError) throw resError;

        revalidatePath(`/admin/t/${tenantSlug}/apps/ferry-booking/orders`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getInvoicePdfAction(tenantSlug: string, orderId: string) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'orders.view');

        const repo = new SupabaseOrderRepository(supabase);
        const order = await repo.findById(tenantId, orderId);

        if (!order) throw new Error("Order not found");

        const invoice = order.invoices?.[0];
        const invoiceNumber = invoice?.invoiceNumber || `TMP-${orderId.slice(0, 8).toUpperCase()}`;

        const mockSummary = {
            id: invoiceNumber,
            currency: order.currency || 'PLN',
            customer_first_name: order.customerFirstName,
            customer_last_name: order.customerLastName || '',
            customer_email: order.customerEmail,
            trip: {
                route: {
                    origin: { name: (order.reservations?.length || 0) > 1 ? 'Multiple Routes' : (order.reservations?.[0] as any)?.trip?.route?.origin?.name || 'Unknown' },
                    destination: { name: (order.reservations?.length || 0) > 1 ? 'See Details' : (order.reservations?.[0] as any)?.trip?.route?.destination?.name || 'Unknown' }
                },
                ferry: { name: (order.reservations?.[0] as any)?.trip?.ferry?.name || 'FerryPortal Fleet' },
                departure_time: (order.reservations?.[0] as any)?.trip?.departure_time || (order.reservations?.[0] as any)?.trip?.departureTime || new Date().toISOString()
            },
            count_passengers: order.reservations?.reduce((s: number, r: any) => s + (r.countPassengers || 0), 0) || 0,
            count_bikes: order.reservations?.reduce((s: number, r: any) => s + (r.countVehicles || 0), 0) || 0,
            count_pets: 0,
            total_amount: order.totalAmount
        };

        const pdfBuffer = await generateInvoicePDFBuffer(mockSummary);

        return { success: true, pdfBase64: pdfBuffer.toString('base64'), filename: `Invoice_${invoiceNumber}.pdf` };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
