
import { createAuthClient } from "@/infra/supabase/server-auth";

export class SupabaseSalesService {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    private get supabase() {
        return this.client || createAuthClient();
    }

    async getDashboardMetrics(tenantId: string) {
        // Limitation: Real analytics should use materialized views or specialized analytics DB.
        // For now, we do simple aggregation on live tables (acceptable for low volume).

        // 1. Total Revenue (Paid Orders)
        const { data: orders, error: orderError } = await this.supabase
            .from('mnt_orders')
            .select('total_amount, currency')
            .eq('tenant_id', tenantId)
            .eq('payment_status', 'PAID');

        if (orderError) throw orderError;

        const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;
        const currency = orders?.[0]?.currency || 'EUR';

        // 2. Total Orders
        const { count: orderCount, error: countError } = await this.supabase
            .from('mnt_orders')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

        if (countError) throw countError;

        // 3. Occupancy (Confirmed Reservations / Total Capacity - Simplified)
        // Calculating real occupancy requires Trip Capacity vs Sold Tickets. 
        // Metric: Global Reservation Count for now.
        const { count: resCount, error: resError } = await this.supabase
            .from('mnt_reservations')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('status', 'CONFIRMED');

        if (resError) throw resError;

        // 4. Cancellation Rate
        const { count: cancelCount, error: cancelError } = await this.supabase
            .from('mnt_reservations')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('status', 'CANCELLED');

        if (cancelError) throw cancelError;

        const totalRes = (resCount || 0) + (cancelCount || 0);
        const cancellationRate = totalRes > 0 ? Math.round(((cancelCount || 0) / totalRes) * 100) : 0;

        return {
            totalRevenue,
            currency,
            totalOrders: orderCount || 0,
            occupancyRate: 75, // Mocked for now (Hard to calc without total capacity aggregation)
            cancellationRate
        };
    }
}
