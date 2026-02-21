'use client'

import { useState, useOptimistic } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    addDays,
    subDays
} from "date-fns"
import { enUS, pl, uk } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Clock, Ship, Lock, LockOpen, Eye } from "lucide-react"
import { deleteTrip, toggleOperationalStatus, toggleTripVisibility } from "../application/actions"
import { CreateTripDialog } from "./create-trip-dialog"
import { EditTripDialog } from "./edit-trip-dialog"

import Link from "next/link"
import { useSearchParams, useParams } from "next/navigation"

import { HeatmapThreshold } from "@/modules/core-admin-settings/domain/heatmap-config"
import { getTripColorStyle as getTripColorStyleUtil } from "./trip-utils"

const localeMap: Record<string, any> = {
    'pl': pl,
    'ua': uk,
    'en': enUS
}

export function ShipScheduleCalendar({
    ferries,
    trips,
    operationalStatuses,
    routes,
    templates,
    sellers,
    heatmapConfig = [],
    initialDate = new Date(),
    initialView = 'month'
}: {
    ferries: any[],
    trips: any[],
    operationalStatuses: any[],
    routes: any[],
    templates: any[],
    sellers: any[],
    heatmapConfig?: HeatmapThreshold[],
    initialDate?: Date,
    initialView?: 'month' | 'week' | 'day'
}) {
    const t = (k: string, options?: any) => typeof options?.defaultValue === 'string' ? options.defaultValue : k;
    const i18n = { language: 'en' };
    const locale = localeMap[i18n.language] || enUS
    const { tenantSlug } = useParams() as { tenantSlug: string }

    const [currentMonth, setCurrentMonth] = useState(initialDate || new Date())
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>(initialView || 'month')
    const [selectedFerryIds, setSelectedFerryIds] = useState<string[]>(ferries.length > 0 ? [ferries[0].id] : [])

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    const calendarDays = viewMode === 'month'
        ? eachDayOfInterval({
            start: startOfWeek(monthStart, { weekStartsOn: 1 }),
            end: endOfWeek(monthEnd, { weekStartsOn: 1 })
        })
        : viewMode === 'week'
            ? eachDayOfInterval({
                start: weekStart,
                end: weekEnd
            })
            : [currentMonth]

    const next = () => setCurrentMonth(viewMode === 'month' ? addMonths(currentMonth, 1) : viewMode === 'week' ? addWeeks(currentMonth, 1) : addDays(currentMonth, 1))
    const prev = () => setCurrentMonth(viewMode === 'month' ? subMonths(currentMonth, 1) : viewMode === 'week' ? subWeeks(currentMonth, 1) : subDays(currentMonth, 1))

    const [optimisticStatuses, addOptimisticStatus] = useOptimistic(
        operationalStatuses,
        (state: any[], newStatus: { ferry_id: string, date: string, is_operational: boolean }) => {
            const exists = state.find((s: any) => s.ferry_id === newStatus.ferry_id && s.date === newStatus.date)
            if (exists) {
                return state.map((s: any) => s.ferry_id === newStatus.ferry_id && s.date === newStatus.date ? { ...s, is_operational: newStatus.is_operational } : s)
            }
            return [...state, newStatus]
        }
    )

    // Dynamic Heatmap color function - Imported from utils
    const getTripColorStyle = (trip: any) => {
        return getTripColorStyleUtil(trip, heatmapConfig)
    }

    const toggleFerry = (id: string) => {
        setSelectedFerryIds(prev =>
            prev.includes(id) ? prev.filter(fi => fi !== id) : [...prev, id]
        )
    }

    const handleToggleStatus = async (dateStr: string, checked: boolean) => {
        if (selectedFerryIds.length === 1) {
            const ferryId = selectedFerryIds[0]
            addOptimisticStatus({ ferry_id: ferryId, date: dateStr, is_operational: checked })
            await toggleOperationalStatus(tenantSlug, ferryId, dateStr, checked)
        }
    }

    return (
        <Card className="shadow-lg border-blue-200 max-w-none w-full">
            <CardHeader className="flex flex-col gap-4 pb-4 bg-slate-50 border-b">
                <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
                        <Ship className="h-5 w-5 text-blue-600" />
                        {t('admin.fleet.schedule.title', 'Fleet Operational Schedule')}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={prev} className="h-9 w-9">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="font-bold min-w-[180px] text-center capitalize text-2xl tracking-tight text-slate-800">
                            {viewMode === 'month' ? format(currentMonth, "LLLL yyyy", { locale }) :
                                viewMode === 'week' ? `${format(weekStart, "dd MMM", { locale })} - ${format(weekEnd, "dd MMM", { locale })}` :
                                    format(currentMonth, "EEEE, dd MMM", { locale })}
                        </span>
                        <Button variant="outline" size="icon" onClick={next} className="h-9 w-9">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedFerryIds(selectedFerryIds.length === ferries.length ? [ferries[0].id] : ferries.map(f => f.id))} className={`gap-1 h-8 text-xs ${selectedFerryIds.length === ferries.length ? "bg-blue-100 border-blue-300" : ""}`}>
                            {selectedFerryIds.length === ferries.length ? t('admin.fleet.schedule.unselectAll', 'Unselect All') : t('admin.fleet.schedule.selectAll', 'Select All Ships')}
                        </Button>
                        {ferries.map(ferry => (
                            <Button
                                key={ferry.id}
                                variant="outline"
                                size="sm"
                                onClick={() => toggleFerry(ferry.id)}
                                className={`gap-1 h-8 text-xs ${selectedFerryIds.includes(ferry.id) ? "bg-blue-50 border-blue-300 text-blue-700" : "text-slate-500"}`}
                            >
                                <Ship size={12} />
                                {ferry.name}
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border shadow-sm h-9 ml-auto">
                        <Button
                            variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('month')}
                            className="text-xs h-7 px-2"
                        >
                            {t('calendar.month', 'Month')}
                        </Button>
                        <Button
                            variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('week')}
                            className="text-xs h-7 px-2"
                        >
                            {t('calendar.week', 'Week')}
                        </Button>
                        <Button
                            variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('day')}
                            className="text-xs h-7 px-2"
                        >
                            {t('calendar.day', 'Day')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-7'} border-b bg-slate-50 ${viewMode !== 'day' ? 'hidden md:grid' : ''}`}>
                    {(viewMode === 'day' ? [format(currentMonth, "EEEE", { locale })] :
                        eachDayOfInterval({
                            start: startOfWeek(new Date(), { weekStartsOn: 1 }),
                            end: endOfWeek(new Date(), { weekStartsOn: 1 })
                        }).map(d => format(d, "EEE", { locale }))
                    ).map(day => (
                        <div key={day} className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 border-r last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-7'}`}>
                    {calendarDays.map((date, i) => {
                        const dateStr = format(date, "yyyy-MM-dd")
                        const isToday = isSameDay(date, new Date())
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6
                        const isCurrentMonth = isSameMonth(date, currentMonth)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const isPastDate = date < today

                        // Gather data for all selected ferries on this day
                        const dayData = selectedFerryIds.map(ferryId => {
                            const ferry = ferries.find(f => f.id === ferryId)
                            const opStatus = optimisticStatuses.find((s: any) => s.ferry_id === ferryId && s.date === dateStr)
                            const isOperational = opStatus ? opStatus.is_operational : true
                            const ferryTrips = trips.filter(t => t.ferry_id === ferryId && isSameDay(new Date(t.departure_time), date))
                            return { ferry, isOperational, trips: ferryTrips }
                        })

                        return (
                            <div
                                key={i}
                                className={`min-h-[160px] border-r border-b p-2 last:border-r-0 transition-colors flex flex-col gap-2 ${!isCurrentMonth ? "bg-slate-50/50 opacity-60" :
                                    isPastDate ? "bg-slate-100/60" :
                                        isWeekend ? "bg-amber-50/20" : "bg-white"
                                    } ${isToday ? "ring-2 ring-inset ring-slate-800 z-[1]" : ""}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-slate-800 text-white shadow-sm" : "text-slate-500"
                                        }`}>
                                        {format(date, "d")}
                                    </span>
                                    {/* Show Day Name on Mobile */}
                                    <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {format(date, "EEEE", { locale })}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-2">
                                    {dayData.map(({ ferry, isOperational, trips }) => {
                                        // Hide empty ships in the past
                                        if (isPastDate && trips.length === 0) return null

                                        return (
                                            <div
                                                key={ferry?.id}
                                                className={`rounded border p-1 shadow-sm transition-all ${isPastDate ? "bg-slate-100 opacity-70 grayscale" :
                                                    !isOperational ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1 pb-1 border-b border-dashed border-slate-200">
                                                    <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                                                        <Ship size={10} className="text-blue-500" /> {ferry?.name}
                                                    </div>
                                                    <Switch
                                                        checked={isOperational}
                                                        disabled={isPastDate}
                                                        onCheckedChange={async (checked) => {
                                                            if (ferry?.id) {
                                                                addOptimisticStatus({ ferry_id: ferry.id, date: dateStr, is_operational: checked })
                                                                await toggleOperationalStatus(tenantSlug, ferry.id, dateStr, checked)
                                                            }
                                                        }}
                                                        className="scale-75"
                                                    />
                                                </div>

                                                {!isOperational && (
                                                    <div className="text-[9px] text-center text-red-500 font-bold uppercase py-1 bg-red-100/50 rounded mt-1">
                                                        NOT OPERATING
                                                    </div>
                                                )}

                                                {isOperational && trips.length > 0 && (
                                                    <div className="space-y-1 mt-1">
                                                        {trips.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()).map(trip => {
                                                            const colorStyle = getTripColorStyle(trip)
                                                            return (
                                                                <div
                                                                    key={trip.id}
                                                                    style={colorStyle}
                                                                    className={`group relative flex flex-col p-2 border rounded-md shadow-sm transition-all min-h-[76px] overflow-hidden hover:scale-[1.02] hover:shadow-md cursor-default`}
                                                                >
                                                                    <div className="flex items-start justify-between min-h-[24px]">
                                                                        <div className="flex items-center gap-1 font-extrabold text-[12px] mt-0.5">
                                                                            <Clock size={12} />
                                                                            {format(new Date(trip.departure_time), "HH:mm")}
                                                                        </div>

                                                                        <div className="flex gap-1 shrink-0">
                                                                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-black/10 text-inherit" asChild>
                                                                                <Link
                                                                                    href={`/admin/reports/manifest/${trip.id}?returnUrl=${encodeURIComponent(`/admin/trips?calDate=${format(currentMonth, 'yyyy-MM-dd')}&calView=${viewMode}`)}`}
                                                                                    title={t('common.viewManifest')}
                                                                                >
                                                                                    <Eye size={12} />
                                                                                </Link>
                                                                            </Button>
                                                                            {!isPastDate && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={async () => await toggleTripVisibility(tenantSlug, trip.id, !trip.is_public)}
                                                                                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-black/10 text-inherit"
                                                                                        title={trip.is_public ? t('common.hideTrip') : t('common.showTrip')}
                                                                                    >
                                                                                        {trip.is_public ? <LockOpen size={12} /> : <Lock size={12} />}
                                                                                    </button>
                                                                                    <EditTripDialog
                                                                                        trip={trip}
                                                                                        routes={routes}
                                                                                        ferries={ferries}
                                                                                        sellers={sellers}
                                                                                        trigger={
                                                                                            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-black/10 text-inherit">
                                                                                                <Pencil size={12} />
                                                                                            </button>
                                                                                        }
                                                                                    />
                                                                                    <button
                                                                                        onClick={async () => {
                                                                                            if (confirm(t('common.confirmDelete'))) await deleteTrip(tenantSlug, trip.id)
                                                                                        }}
                                                                                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-500 hover:text-white text-inherit"
                                                                                    >
                                                                                        <Trash2 size={12} />
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-[11px] leading-tight font-bold uppercase mt-1 truncate">
                                                                        {trip.route?.origin?.name} &rarr; {trip.route?.destination?.name}
                                                                        {!trip.is_public && (
                                                                            <div className="mt-1 flex">
                                                                                <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm border border-red-700 animate-pulse">
                                                                                    {t('admin.trips.table.blocked')}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {(viewMode === 'week' || viewMode === 'day') && (
                                                                        <div className="text-[9px] font-medium opacity-80 mt-1">
                                                                            {t('admin.trips.table.occupancy', {
                                                                                percent: Math.round(((trip.booked_count || 0) / (trip.ferry?.capacity_passengers || 1)) * 100)
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                                {isOperational && !isPastDate && (
                                                    <div className="mt-2">
                                                        <CreateTripDialog
                                                            routes={routes.filter(r => !r.ferry_id || r.ferry_id === ferry?.id)}
                                                            ferries={ferry ? [ferry] : []}
                                                            sellers={sellers}
                                                            defaultDate={date}
                                                            trigger={
                                                                <Button variant="ghost" className="w-full h-auto min-h-[28px] py-1 border-dashed border-2 px-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-400 transition-all whitespace-normal leading-tight">
                                                                    <Plus size={10} className="mr-1 shrink-0" /> {t('common.add')}
                                                                </Button>
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card >
    )
}
