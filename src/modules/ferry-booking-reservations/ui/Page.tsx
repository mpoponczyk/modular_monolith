import { Suspense } from 'react';
import { verifyPageAccess } from '@/core/auth/actions';
import { listReservationsAction, getAvailableTripsForReservationAction } from '../application/actions';
import { CreateReservationDialog } from './create-reservation-dialog';
import { ReservationFilters } from './reservation-filters';
import { ReservationsTable } from './reservations-table';
import { Loader2 } from 'lucide-react';
import { createAuthClient } from '@/infra/supabase/server-auth';

export default async function ReservationsPage({ params, searchParams }: { params: Promise<{ tenantSlug: string }>, searchParams: Promise<{ q?: string; status?: string }> }) {
    const { tenantSlug } = await params;
    const { q, status } = await searchParams;
    const { tenantId } = await verifyPageAccess(tenantSlug, 'reservations.view');

    // Fetch Reservations via existing server action (returns structured Repository DTOs)
    let reservations = await listReservationsAction(tenantSlug);

    // Apply basic filtering in memory since we already fetched all from Repo
    if (status && status !== 'all') {
        reservations = reservations.filter(r => r.status === status);
    }

    if (q) {
        const queryTerm = q.toLowerCase();
        reservations = reservations.filter(r => {
            const customerName = `${r.order?.customer_first_name || ''} ${r.order?.customer_last_name || ''}`.toLowerCase();
            return (
                r.id.toLowerCase().includes(queryTerm) ||
                (r.order?.customer_email || '').toLowerCase().includes(queryTerm) ||
                customerName.includes(queryTerm)
            );
        });
    }

    // Map the monolith's strictly nested DTO back to the legacy flat AST expectation
    const mappedReservations = reservations.map((res: any) => ({
        id: res.id,
        created_at: res.created_at || new Date().toISOString(),
        order_id: res.orderId,
        customer_email: res.order?.customer_email,
        customer_first_name: res.order?.customer_first_name,
        customer_last_name: res.order?.customer_last_name,
        phone_number: res.order?.phone_number || res.phone_number,
        total_amount: res.totalAmount,
        currency: res.order?.currency || 'PLN',
        status: res.status,
        count_passengers: res.countPassengers,
        count_bikes: res.countVehicles,
        notes: res.notes,
        trip: res.trip ? {
            departure_time: res.trip.departureTime,
            route: res.trip.route ? {
                origin: { name: res.trip.route.origin?.name },
                destination: { name: res.trip.route.destination?.name }
            } : null
        } : null
    }));

    // Fetch available trips for the Create Dialog
    const availableTrips = await getAvailableTripsForReservationAction(tenantSlug);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-blue-700">Reservations</h1>
                    <p className="text-muted-foreground">
                        Manage bookings and assign users.
                    </p>
                </div>
                <CreateReservationDialog trips={availableTrips || []} />
            </div>

            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>}>
                <ReservationFilters />
                <ReservationsTable reservations={mappedReservations} />
            </Suspense>
        </div>
    );
}
