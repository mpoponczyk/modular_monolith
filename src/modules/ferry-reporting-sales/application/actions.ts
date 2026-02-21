'use server';

import { createAuthClient } from "@/infra/supabase/server-auth";
import { verifyTenantAccess } from "@/core/auth/access";

export async function getSalesAnalyticsAction(tenantSlug: string) {
    try {
        const supabase = createAuthClient();
        const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'reporting.view');

        const now = new Date();

        // Month-to-Date (MTD) Range
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        // Previous Month for MoM (same day relative to start of month)
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonthToday = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 23, 59, 59);

        // Last 7 Days for Bar Chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // 1. Fetch MTD Data (using mnt_orders and filtering by tenantId)
        const { data: mtdOrders, error: mtdError } = await supabase
            .from('mnt_orders')
            .select('created_at, total_amount')
            .eq('tenant_id', tenantId)
            .gte('created_at', startOfMonth.toISOString())
            .lte('created_at', endOfToday.toISOString());

        if (mtdError) throw mtdError;

        // 2. Fetch Previous Month (MoM comparison)
        const { data: prevMonthOrders, error: prevError } = await supabase
            .from('mnt_orders')
            .select('created_at, total_amount')
            .eq('tenant_id', tenantId)
            .gte('created_at', startOfPrevMonth.toISOString())
            .lte('created_at', endOfPrevMonthToday.toISOString());

        if (prevError) throw prevError;

        // 3. Fetch 7-day history for charts
        const { data: weekOrders, error: weekError } = await supabase
            .from('mnt_orders')
            .select('created_at, total_amount')
            .eq('tenant_id', tenantId)
            .gte('created_at', sevenDaysAgo.toISOString())
            .lte('created_at', endOfToday.toISOString());

        if (weekError) throw weekError;

        // Aggregation Helpers
        const aggregate = (data: any[]) => ({
            total: data?.reduce((s, o) => s + Number(o.total_amount), 0) || 0,
            count: data?.length || 0
        });

        const mtd = aggregate(mtdOrders);
        const prevMoM = aggregate(prevMonthOrders);

        // Yesterday's (Daily Increment)
        const yesterdayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0];
        const { data: yesterdayOrders } = await supabase
            .from('mnt_orders')
            .select('total_amount')
            .eq('tenant_id', tenantId)
            .gte('created_at', `${yesterdayStr}T00:00:00`)
            .lte('created_at', `${yesterdayStr}T23:59:59`);

        const daily = aggregate(yesterdayOrders || []);

        // 7-Day History for Bars
        const historyDays = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const revenueTrend = historyDays.map(day =>
            weekOrders?.filter(o => o.created_at.startsWith(day))
                .reduce((s, o) => s + Number(o.total_amount), 0) || 0
        );
        const bookingsTrend = historyDays.map(day =>
            weekOrders?.filter(o => o.created_at.startsWith(day)).length || 0
        );

        // Calculate MoM Trend %
        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        return {
            success: true,
            revenue: {
                currentMtd: mtd.total,
                dailyIncrement: daily.total,
                trend: revenueTrend,
                momChange: calcTrend(mtd.total, prevMoM.total)
            },
            bookings: {
                currentMtd: mtd.count,
                dailyIncrement: daily.count,
                trend: bookingsTrend,
                momChange: calcTrend(mtd.count, prevMoM.count)
            }
        };
    } catch (e: any) {
        console.error("Sales Analytics Error:", e);
        return { success: false, error: e.message };
    }
}
