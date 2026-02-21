'use client'

import { useState } from "react"
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    isBefore,
    addMonths,
    subMonths
} from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, Ship, Clock, MapPin, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Trip {
    id: string
    departure_time: string
    price?: number // Optional for admin
    pricing?: any[]
    route: {
        origin: { name: string }
        destination: { name: string }
    }
    ferry: {
        name: string
    }
    available_seats?: number
    capacity?: number
    // Add other fields as needed
    [key: string]: any
}

interface UnifiedCalendarProps {
    trips: Trip[]
    currentMonth: Date
    loading: boolean
    onMonthChange: (date: Date) => void

    // Configuration
    mode: 'booking' | 'admin' | 'picker'
    linkTemplate?: string // e.g. "/book/[id]" - use [id] placeholder
    onSelectDate?: (date: Date) => void
    requiredCapacity?: {
        passengers: number
        bikes: number
        pets: number
    }
}

export default function UnifiedCalendar({
    trips,
    currentMonth,
    loading,
    onMonthChange,
    mode,
    linkTemplate,
    onSelectDate,
    requiredCapacity
}: UnifiedCalendarProps) {
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Navigation
    const nextMonth = () => onMonthChange(addMonths(currentMonth, 1))
    const prevMonth = () => onMonthChange(subMonths(currentMonth, 1))

    // Grid Generation
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    // Helpers
    const getDayTrips = (day: Date) => trips.filter(t => isSameDay(new Date(t.departure_time), day))

    const checkAvailability = (trip: Trip) => {
        if (!requiredCapacity) return (trip.available_seats ?? 999) > 0

        const okPax = (trip.available_seats ?? 999) >= requiredCapacity.passengers
        const okBikes = (trip.available_bikes ?? 999) >= requiredCapacity.bikes
        const okPets = (trip.available_pets ?? 999) >= requiredCapacity.pets
        return okPax && okBikes && okPets
    }

    const handleDayClick = (day: Date, dayTrips: Trip[]) => {
        // Filter trips by capacity if required
        const availableTrips = requiredCapacity
            ? dayTrips.filter(checkAvailability)
            : dayTrips

        if (mode === 'picker') {
            onSelectDate?.(day)
            return
        }

        // Always open dialog for booking/admin to show status or allow adding
        setSelectedDay(day)
        setIsDialogOpen(true)
    }

    // Resolve Link URL (unchanged)
    const getTripLink = (trip: Trip) => {
        if (!linkTemplate) return '#'
        return linkTemplate.replace('[id]', trip.id)
    }

    const getMinPrice = (trip: Trip) => {
        if (trip.price) return trip.price
        if (trip.pricing) {
            const adult = trip.pricing.find((p: any) => p.service_type === 'ADULT')
            return adult?.price || 0
        }
        return 0
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 capitalized">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={prevMonth} disabled={loading} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} disabled={loading} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Grid Headers */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-2">
                {weekDays.map(d => <div key={d} className="py-2">{d}</div>)}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                {calendarDays.map((day, idx) => {
                    const dayTrips = getDayTrips(day)
                    const totalTripsCount = dayTrips.length

                    // Filter by capacity if needed
                    const availableTrips = requiredCapacity
                        ? dayTrips.filter(checkAvailability)
                        : dayTrips

                    const count = availableTrips.length
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const isDateToday = isToday(day)
                    const isPast = isBefore(day, new Date()) && !isDateToday

                    const hasPlannedTrips = totalTripsCount > 0
                    const hasAvailableTrips = count > 0

                    // Min price logic
                    const minPrice = hasAvailableTrips ? Math.min(...availableTrips.map(t => getMinPrice(t))) : 0

                    const isSoldOut = hasPlannedTrips && !hasAvailableTrips

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => !isPast && (hasAvailableTrips || mode === 'picker') && handleDayClick(day, dayTrips)}
                            className={cn(
                                "min-h-[100px] p-2 bg-white flex flex-col justify-between transition-all relative group",
                                !isCurrentMonth && "bg-slate-50/50 text-slate-400 opacity-50",
                                isPast && "bg-slate-50 opacity-60 cursor-not-allowed",
                                !isPast && (hasAvailableTrips || mode === 'picker') && "hover:bg-blue-50 cursor-pointer hover:z-10 hover:shadow-sm",
                                isDateToday && "ring-1 ring-inset ring-blue-500 bg-blue-50/30"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                    isDateToday ? "bg-blue-600 text-white" : "text-slate-700"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            {/* Content Badge */}
                            <div className="mt-2 space-y-1">
                                {loading && isCurrentMonth ? (
                                    <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
                                ) : hasAvailableTrips ? (
                                    <>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "w-full justify-center text-xs h-7 px-0 border-none transition-colors font-bold",
                                                "bg-green-100 text-green-800 hover:bg-green-200"
                                            )}
                                        >
                                            {count} {count === 1 ? 'Trip' : 'Trips'}
                                        </Badge>
                                        {(mode === 'booking' || mode === 'picker') && minPrice > 0 ? (
                                            <div className="text-[10px] text-center text-slate-500 font-medium">
                                                from {minPrice}zl
                                            </div>
                                        ) : null}
                                    </>
                                ) : isSoldOut && !isPast ? (
                                    <div className="text-[10px] text-center text-red-500 font-bold uppercase leading-tight">
                                        No free slots
                                    </div>
                                ) : !hasPlannedTrips && !isPast && (mode === 'booking' || mode === 'picker') ? (
                                    <div className="text-[9px] text-center text-slate-300 italic group-hover:text-blue-400 leading-tight">
                                        No planned cruises
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 p-2 rounded-lg"><Clock size={16} /></span>
                            {selectedDay && format(selectedDay, "EEEE, MMMM do")}
                        </DialogTitle>
                        <DialogDescription>
                            {getDayTrips(selectedDay || new Date()).length} trips available
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-3 mt-2">
                            {selectedDay && getDayTrips(selectedDay).length === 0 && (
                                <div className="text-center py-8 text-slate-500 italic">
                                    No trips scheduled for this day.
                                </div>
                            )}
                            {selectedDay && getDayTrips(selectedDay).map((trip) => {
                                const ferryName = Array.isArray(trip.ferry) ? trip.ferry[0]?.name : trip.ferry?.name
                                const route = Array.isArray(trip.route) ? trip.route[0] : trip.route
                                const origin = Array.isArray(route?.origin) ? route.origin[0]?.name : route?.origin?.name
                                const dest = Array.isArray(route?.destination) ? route.destination[0]?.name : route?.destination?.name
                                const price = getMinPrice(trip)

                                const CardContent = (
                                    <div className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[3.5rem]">
                                                <div className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                                                    {format(new Date(trip.departure_time), "HH:mm")}
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Departure</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium flex items-center gap-1.5">
                                                    {origin} <span className="text-slate-300">→</span> {dest}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Ship size={10} /> {ferryName}
                                                </div>
                                            </div>
                                        </div>

                                        {mode !== 'admin' && (
                                            <div className="text-right">
                                                <div className="text-blue-600 font-bold">{price} zł</div>
                                                <Badge variant="outline" className="text-[10px] h-5 border-blue-200 text-blue-700">Select</Badge>
                                            </div>
                                        )}
                                        {mode === 'admin' && (
                                            <Badge className="bg-slate-900 text-white hover:bg-slate-700">View</Badge>
                                        )}
                                    </div>
                                )

                                if (mode === 'booking' || mode === 'admin') {
                                    return (
                                        <Link key={trip.id} href={getTripLink(trip)} onClick={() => setIsDialogOpen(false)} className="block">
                                            {CardContent}
                                        </Link>
                                    )
                                }

                                return <div key={trip.id}>{CardContent}</div>
                            })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}
