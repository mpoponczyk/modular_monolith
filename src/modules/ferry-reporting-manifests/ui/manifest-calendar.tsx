'use client'

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, FileText, Ship } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getManifestTripsForMonthAction } from "../application/actions"
import Link from "next/link"
import { cn } from "@/lib/utils"
import UnifiedCalendar from "@/components/unified-calendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

export default function ManifestCalendar({ preSelectedShipId, tenantSlug }: { preSelectedShipId?: string, tenantSlug: string }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [trips, setTrips] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedShip, setSelectedShip] = useState<string | null>(null)

    useEffect(() => {
        async function loadTrips() {
            setLoading(true)
            const start = startOfMonth(currentMonth)
            const end = endOfMonth(currentMonth)
            const data = await getManifestTripsForMonthAction(tenantSlug, start, end)
            setTrips(data)
            setLoading(false)
        }
        loadTrips()
    }, [currentMonth, tenantSlug])

    const visibleTrips = preSelectedShipId
        ? trips.filter(t => t.ferry_id === preSelectedShipId)
        : trips

    const selectedDayTrips = selectedDate
        ? visibleTrips.filter(t => isSameDay(new Date(t.departure_time), selectedDate))
        : []

    const ships = Array.from(new Set(selectedDayTrips.map(t => {
        return Array.isArray(t.ferry) ? t.ferry[0]?.name : t.ferry?.name
    }))).filter(Boolean) as string[]

    useEffect(() => {
        if (preSelectedShipId && visibleTrips.length > 0) {
            const shipName = visibleTrips[0].ferry?.name
            if (shipName) setSelectedShip(shipName)
        }
    }, [preSelectedShipId, visibleTrips])

    const filteredTrips = selectedShip
        ? selectedDayTrips.filter(t => {
            const ferryName = Array.isArray(t.ferry) ? t.ferry[0]?.name : t.ferry?.name
            return ferryName === selectedShip
        })
        : selectedDayTrips

    function handleDateSelect(date: Date) {
        setSelectedDate(date)
        if (!preSelectedShipId) setSelectedShip(null)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    Manifest Reports
                </h2>
            </div>

            <UnifiedCalendar
                trips={visibleTrips}
                currentMonth={currentMonth}
                loading={loading}
                onMonthChange={setCurrentMonth}
                mode="picker"
                onSelectDate={handleDateSelect}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDate ? format(selectedDate, "EEEE, MMMM do") : "Select Trip"}
                        </DialogTitle>
                        <DialogDescription>
                            Select a ship to view available trips.
                        </DialogDescription>
                    </DialogHeader>

                    {!selectedShip ? (
                        <div className="grid grid-cols-1 gap-4 py-4">
                            {selectedDayTrips.length === 0 && <p className="text-center text-muted-foreground">No trips scheduled for this day.</p>}
                            {ships.map(shipName => (
                                <Button
                                    key={shipName}
                                    variant="outline"
                                    className="h-16 text-lg justify-start px-6 gap-4 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                    onClick={() => setSelectedShip(shipName)}
                                >
                                    <Ship className="h-6 w-6 text-slate-400" />
                                    {shipName}
                                    <span className="ml-auto text-xs bg-slate-100 text-slate-600 py-1 px-2 rounded-full">
                                        {selectedDayTrips.filter(t => (Array.isArray(t.ferry) ? t.ferry[0]?.name : t.ferry?.name) === shipName).length} Trips
                                    </span>
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedShip(null)} className="gap-1 pl-0 text-muted-foreground hover:text-foreground">
                                <ChevronLeft size={16} /> Back to Ships
                            </Button>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Ship size={18} className="text-blue-600" />
                                {selectedShip}
                            </h3>

                            <div className="grid gap-3">
                                {filteredTrips.map(trip => (
                                    <Link
                                        key={trip.id}
                                        href={`/admin/t/${tenantSlug}/apps/ferry-reporting/manifests/${trip.id}?returnUrl=${encodeURIComponent(`/admin/t/${tenantSlug}/apps/ferry-reporting/manifests`)}`}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-xl font-bold text-slate-900 group-hover:text-blue-700">
                                                {format(new Date(trip.departure_time), "HH:mm")}
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {trip.route?.origin?.name || trip.route?.[0]?.origin?.name} <span className="text-slate-300">→</span> {trip.route?.destination?.name || trip.route?.[0]?.destination?.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    ID: {trip.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
