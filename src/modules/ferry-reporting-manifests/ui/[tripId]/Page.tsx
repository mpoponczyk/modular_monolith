import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PrintButton } from "./print-button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getManifestDetailRawAction } from "../../application/actions"

export default async function ManifestReportDetail({ params, searchParams }: { params: Promise<{ tenantSlug: string, tripId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { tenantSlug, tripId } = await params
    const sParams = await searchParams
    const returnUrl = (sParams?.returnUrl as string) || `/admin/t/${tenantSlug}/apps/ferry-reporting/manifests`
    const isReturningToSchedule = returnUrl.includes('/apps/ferry-booking/trips')

    let manifestData;
    try {
        manifestData = await getManifestDetailRawAction(tenantSlug, tripId)
    } catch (e) {
        return notFound()
    }

    const { trip, reservations } = manifestData;

    // Calculate totals
    const totalPassengers = reservations?.reduce((sum: number, res: any) => sum + (res.count_passengers || 0), 0) || 0
    const totalBikes = reservations?.reduce((sum: number, res: any) => sum + (res.count_bikes || 0), 0) || 0
    const totalPets = reservations?.reduce((sum: number, res: any) => sum + (res.count_pets || 0), 0) || 0

    // Group by Zone
    const groupedReservations: Record<string, typeof reservations> = {}
    const NO_ZONE_KEY = "General Admission"

    if (reservations) {
        reservations.forEach((res: any) => {
            const zoneName = res.zone?.name || NO_ZONE_KEY
            if (!groupedReservations[zoneName]) {
                groupedReservations[zoneName] = []
            }
            groupedReservations[zoneName].push(res)
        })
    }

    // Sort zone names
    const sortedZoneNames = Object.keys(groupedReservations).sort()

    return (
        <div className="space-y-8 max-w-5xl mx-auto print:max-w-none print:p-0">
            {/* Header / Navigation (Hidden in Print) */}
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" asChild>
                    <Link href={returnUrl}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {isReturningToSchedule ? "Back to Schedule" : "Back to Calendar"}
                    </Link>
                </Button>
                <PrintButton />
            </div>

            {/* Manifest Content */}
            <div className="bg-white p-8 rounded-xl shadow-sm border print:border-none print:shadow-none">
                {/* Trip Info Header */}
                <div className="border-b pb-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Passenger Manifest</h1>
                            <div className="text-slate-500 mt-1">
                                {trip.route?.origin?.name} &rarr; {trip.route?.destination?.name}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                                Ferry: {trip.ferry?.name}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-mono font-bold text-blue-600">
                                {format(new Date(trip.departure_time), "dd MMM yyyy")}
                            </div>
                            <div className="text-xl font-mono text-slate-700">
                                {format(new Date(trip.departure_time), "HH:mm")}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mt-6 print:grid-cols-4">
                        <div className="bg-slate-50 p-3 rounded-lg border print:border-slate-300">
                            <div className="text-xs text-slate-500 uppercase font-bold">Total Pax</div>
                            <div className="text-xl font-bold">{totalPassengers} <span className="text-sm font-normal text-slate-400">/ {trip.ferry?.capacity_passengers}</span></div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border print:border-slate-300">
                            <div className="text-xs text-slate-500 uppercase font-bold">Bikes</div>
                            <div className="text-xl font-bold">{totalBikes} <span className="text-sm font-normal text-slate-400">/ {trip.ferry?.capacity_bikes}</span></div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border print:border-slate-300">
                            <div className="text-xs text-slate-500 uppercase font-bold">Pets</div>
                            <div className="text-xl font-bold">{totalPets} <span className="text-sm font-normal text-slate-400">/ {trip.ferry?.capacity_pets}</span></div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border print:border-slate-300">
                            <div className="text-xs text-slate-500 uppercase font-bold">Bookings</div>
                            <div className="text-xl font-bold">{reservations?.length || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Reservation Lists by Zone */}
                {(!reservations || reservations.length === 0) ? (
                    <div className="text-center py-12 text-slate-500 italic border rounded-lg bg-slate-50">
                        No confirmed reservations for this trip yet.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedZoneNames.map(zoneName => (
                            <div key={zoneName} className="break-inside-avoid">
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 pb-2 border-b-2 border-slate-100">
                                    <Badge className="text-base rounded-md px-3 py-1 bg-slate-800 hover:bg-slate-800">
                                        {zoneName}
                                    </Badge>
                                    <span className="text-sm font-normal text-slate-500 ml-auto">
                                        {groupedReservations[zoneName]?.length || 0} bookings
                                    </span>
                                </h3>

                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="w-[50px] font-bold text-slate-700">#</TableHead>

                                            <TableHead className="font-bold text-slate-700">Customer</TableHead>
                                            <TableHead className="font-bold text-slate-700">Phone</TableHead>
                                            <TableHead className="font-bold text-slate-700">Notes</TableHead>
                                            <TableHead className="text-center w-[60px] font-bold text-slate-700">Pax</TableHead>
                                            <TableHead className="text-center w-[60px] font-bold text-slate-700">Pets</TableHead>
                                            <TableHead className="text-center w-[60px] font-bold text-slate-700">Bikes</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedReservations[zoneName]?.map((res: any, index: number) => (
                                            <TableRow key={res.id}>
                                                <TableCell className="font-mono text-slate-500 font-medium">
                                                    {index + 1}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="font-bold text-slate-900">
                                                        {(res.customer_first_name || res.customer_last_name)
                                                            ? `${res.customer_first_name || ''} ${res.customer_last_name || ''}`.trim()
                                                            : <span className="italic text-slate-400">Guest User</span>}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{res.customer_email}</div>

                                                    {/* Ticket Names if available */}
                                                    {res.tickets && res.tickets.length > 0 && res.tickets.some((t: any) => t.passenger_name) && (
                                                        <div className="text-xs text-slate-600 mt-1 pl-2 border-l-2 border-slate-200 italic">
                                                            {res.tickets.filter((t: any) => t.passenger_name).map((t: any) => t.passenger_name).join(", ")}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {res.phone_number ? <span className="text-slate-700">{res.phone_number}</span> : <span className="text-slate-300">-</span>}
                                                </TableCell>
                                                <TableCell className="text-sm max-w-[150px] truncate" title={res.notes || ""}>
                                                    {res.notes ? <span className="text-amber-700 italic">{res.notes}</span> : <span className="text-slate-300">-</span>}
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-slate-700">
                                                    {res.count_passengers}
                                                </TableCell>
                                                <TableCell className="text-center text-slate-600">
                                                    {res.count_pets > 0 ? res.count_pets : <span className="text-slate-200">-</span>}
                                                </TableCell>
                                                <TableCell className="text-center text-slate-600">
                                                    {res.count_bikes > 0 ? res.count_bikes : <span className="text-slate-200">-</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                        res.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                            res.status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                                'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                    )}>
                                                        {res.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t flex justify-between items-center text-xs text-slate-400 print:mt-auto">
                    <span>Generated on {format(new Date(), "PPpp")}</span>
                    <span>Admin System</span>
                </div>
            </div>
        </div>
    )
}
