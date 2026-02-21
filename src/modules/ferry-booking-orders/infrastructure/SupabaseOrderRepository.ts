import { IOrderRepository } from "../domain/ports";
import { Order } from "../domain/types";
import { createAuthClient } from "@/infra/supabase/server-auth";

import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseOrderRepository implements IOrderRepository {
    constructor(private client?: SupabaseClient) { }

    async create(tenantId: string, order: Partial<Order>): Promise<string> {
        const supabase = this.client || createAuthClient();

        const { data, error } = await supabase.rpc('create_order', {
            p_tenant_id: tenantId,
            p_customer_email: order.customerEmail,
            p_total_amount: order.totalAmount,
            p_customer_first_name: order.customerFirstName || null,
            p_customer_last_name: order.customerLastName || null
        });

        if (error) {
            console.error("Error creating order:", error);
            throw new Error("Failed to create order");
        }

        return data;
    }

    async findById(tenantId: string, id: string): Promise<Order | null> {
        const supabase = this.client || createAuthClient();

        const { data, error } = await supabase
            .from("mnt_orders")
            .select(`
                *,
                reservations:mnt_reservations(*, trip:mnt_trips(id, departure_time, route:mnt_routes(origin:mnt_locations!mnt_routes_origin_fkey(name), destination:mnt_locations!mnt_routes_dest_fkey(name)))),
                invoices:mnt_invoices(*)
            `)
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .single();

        if (error) return null;

        return this.mapToDomain(data);
    }

    async findAll(tenantId: string): Promise<Order[]> {
        const supabase = this.client || createAuthClient();

        const { data, error } = await supabase
            .from("mnt_orders")
            .select(`
                *,
                reservations:mnt_reservations(*, trip:mnt_trips(id, departure_time, route:mnt_routes(origin:mnt_locations!mnt_routes_origin_fkey(name), destination:mnt_locations!mnt_routes_dest_fkey(name)), ferry:mnt_ferries(name))),
                invoices:mnt_invoices(*)
            `)
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching orders:", error);
            return [];
        }

        return (data || []).map((row: any) => this.mapToDomain(row));
    }

    private mapToDomain(row: any): Order {
        return {
            id: row.id,
            tenantId: row.tenant_id,
            customerEmail: row.customer_email,
            customerFirstName: row.customer_first_name,
            customerLastName: row.customer_last_name,
            status: row.status,
            paymentStatus: row.payment_status,
            totalAmount: row.total_amount,
            currency: row.currency,
            createdAt: row.created_at,
            reservations: row.reservations ? row.reservations.map((r: any) => ({
                id: r.id,
                tenantId: r.tenant_id,
                orderId: r.order_id,
                tripId: r.trip_id,
                status: r.status,
                totalAmount: r.total_amount,
                countPassengers: r.count_passengers,
                countVehicles: r.count_vehicles,
                // Nested trip info for display
                trip: r.trip
            })) : [],
            invoices: row.invoices ? row.invoices.map((i: any) => ({
                id: i.id,
                tenantId: i.tenant_id,
                orderId: i.order_id,
                invoiceNumber: i.invoice_number,
                amountTotal: i.amount_total,
                fileUrl: i.file_url
            })) : []
        };
    }
}
