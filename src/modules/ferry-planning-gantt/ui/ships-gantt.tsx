"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { format, differenceInMinutes, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns"
import { pl, enUS, uk } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Ship, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Clock, Edit, Lock, LockOpen, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
export interface HeatmapThreshold {
    threshold: number
    color: string
}
import { getTripColorStyle } from "./trip-utils"
import { EditTripDialog } from "./edit-trip-dialog"
import { DeleteTripButton } from "./delete-trip-button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toggleTripVisibility } from "../application/actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSearchParams, useParams } from "next/navigation"

interface ShipsGanttProps {
    trips: any[]
    ferries: any[]
    routes: any[]
    partners: any[]
    initialDate?: Date
    heatmapConfig: HeatmapThreshold[]
}

const getLocale = (i18nLanguage: string) => {
    switch (i18nLanguage) {
        case 'pl': return pl
        case 'ua': return uk
        default: return enUS
    }
}

type ViewMode = 'day' | 'week'

// Defined outside to prevent re-creation on render
const TripCard = ({ trip, ferry, style, pxWidth, routes, ferries, partners, tenantSlug }: {
    trip: any,
    ferry: any,
    style: any,
    pxWidth: number,
    routes: any[],
    ferries: any[],
    partners: any[],
    tenantSlug: string
}) => {
    const tripStart = new Date(trip.departure_time)
    const tripEnd = new Date(trip.arrival_time)
    const freeSeats = Math.max(0, (trip.ferry?.capacity_passengers || 0) - (trip.booked_count || 0))
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "absolute rounded-md border flex flex-col p-0.5 overflow-hidden shadow-sm transition-all hover:scale-[1.02] hover:z-50 cursor-pointer group/trip text-left leading-none",
                        style.isPast && "grayscale grayscale-50 opacity-80"
                    )}
                    style={{
                        left: `${style.left}px`,
                        width: `${style.width}px`,
                        top: '2px',
                        bottom: '2px',
                        backgroundColor: style.backgroundColor,
                        color: style.color,
                        border: style.border
                    }}
                >
                    {/* Time Range */}
                    <div className="text-[10px] font-bold mb-0.5 border-b pb-0.5 border-black/10 leading-tight">
                        {format(tripStart, "HH:mm")} - {format(tripEnd, "HH:mm")}
                    </div>

                    {/* Route Info */}
                    <div className="flex-1 flex flex-col justify-center gap-[1px]">
                        <div className="text-[9px] font-semibold truncate leading-tight" title={trip.route?.origin?.name}>
                            {trip.route?.origin?.name}
                        </div>
                        <div className="flex justify-center py-[1px]">
                            <span className="text-[7px] opacity-70 uppercase font-bold tracking-widest leading-none">
                                to
                            </span>
                        </div>
                        <div className="text-[9px] font-semibold truncate leading-tight" title={trip.route?.destination?.name}>
                            {trip.route?.destination?.name}
                        </div>
                    </div>

                    {/* Locked Overlay */}
                    {!trip.is_public && (
                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                            {/* Diagonal Stripe Pattern */}
                            <div className="absolute inset-0 opacity-[0.08]" style={{
                                backgroundImage: `repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)`
                            }} />
                            {/* Diagonal Label */}
                            <div className="absolute top-[6px] -right-[12px] bg-red-100/95 border border-red-200 shadow-sm transform rotate-45 flex items-center justify-center px-4 py-0.5 w-[80px]">
                                <span className="text-[6px] font-black text-red-600 tracking-widest uppercase leading-none">
                                    LOCKED
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Free Seats - BIGGER */}
                    <div className="mt-auto pt-1 border-t border-black/5 flex items-end justify-between relative z-10">
                        <div className="text-[16px] font-black leading-none text-slate-800 tracking-tighter">
                            {freeSeats}
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase pb-[1px]">
                            Free
                        </div>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden" align="start" side="bottom">
                <div className="bg-slate-50 border-b p-3">
                    <h4 className="font-bold text-base">{trip.route?.origin?.name} &rarr; {trip.route?.destination?.name}</h4>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Clock size={14} />
                        {format(tripStart, "PPP")} | {format(tripStart, "HH:mm")} - {format(tripEnd, "HH:mm")}
                    </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-2">
                    {/* Manifest */}
                    <Link href={`/admin/reports/manifest/${trip.id}`} className="col-span-1">
                        <Button variant="outline" className="w-full h-16 flex flex-col gap-1 items-center justify-center border-2 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700">
                            <Eye size={20} />
                            <span className="text-xs font-bold">Manifest</span>
                        </Button>
                    </Link>

                    {/* Edit */}
                    <EditTripDialog
                        trip={trip}
                        routes={routes}
                        ferries={ferries}
                        sellers={partners}
                        trigger={
                            <Button variant="outline" className="w-full h-16 flex flex-col gap-1 items-center justify-center border-2 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700">
                                <Edit size={20} />
                                <span className="text-xs font-bold">Edit Trip</span>
                            </Button>
                        }
                    />

                    {/* Visibility */}
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full h-16 flex flex-col gap-1 items-center justify-center border-2 hover:bg-slate-50",
                            trip.is_public ? "hover:border-amber-500 hover:text-amber-700" : "hover:border-green-500 hover:text-green-700"
                        )}
                        onClick={async () => {
                            await toggleTripVisibility(tenantSlug, trip.id, !trip.is_public)
                        }}
                    >
                        {trip.is_public ? <LockOpen size={20} /> : <Lock size={20} />}
                        <span className="text-xs font-bold">{trip.is_public ? "Public" : "Hidden"}</span>
                    </Button>

                    {/* Delete */}
                    <div className="col-span-1">
                        <DeleteTripButton
                            tripId={trip.id}
                            iconSize={20}
                            className="w-full h-16 flex flex-col gap-1 items-center justify-center border-2 border-red-100 hover:border-red-500 hover:bg-red-50 hover:text-red-700 rounded-md"
                        />
                    </div>
                </div>

                <div className="p-2 border-t bg-slate-50 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-slate-900">
                        Cancel
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

interface DayColumnBodyProps {
    dayDate: Date
    trips: any[]
    row: any
    routes: any[]
    partners: any[]
    startHour: number
    endHour: number
    hourWidth: number
    ROW_HEIGHT: number
    now: Date
    heatmapConfig: HeatmapThreshold[]
    tenantSlug: string
}

const DayColumnBody = ({
    dayDate,
    trips,
    row,
    routes,
    partners,
    startHour,
    endHour,
    hourWidth,
    ROW_HEIGHT,
    now,
    heatmapConfig,
    tenantSlug
}: DayColumnBodyProps) => {
    const dayStart = startOfDay(dayDate)
    dayStart.setHours(startHour, 0, 0, 0)
    const dayEnd = endOfDay(dayDate)
    dayEnd.setHours(endHour, 0, 0, 0)

    const dayTrips = useMemo(() => trips.filter(trip => {
        const t = new Date(trip.departure_time)
        return t >= dayStart && t <= dayEnd
    }), [trips, dayStart, dayEnd])

    return (
        <div style={{ width: `${(endHour - startHour) * hourWidth}px` }} className="relative flex-shrink-0 h-full">
            {dayTrips
                .filter(t => {
                    if (row.type === 'route') {
                        return t.ferry_id === row.ferryId && t.route_id === row.routeId
                    } else {
                        return t.ferry_id === row.ferryId
                    }
                })
                .map(trip => {
                    const routeDuration = trip.route?.estimated_duration_minutes || 60
                    const tripStart = new Date(trip.departure_time)
                    const isPast = tripStart < now

                    const heatStyle = getTripColorStyle(trip, heatmapConfig)
                    const leftPx = (differenceInMinutes(tripStart, dayStart) / 60) * hourWidth
                    const widthPx = (routeDuration / 60) * hourWidth

                    return (
                        <TripCard
                            key={trip.id}
                            trip={trip}
                            ferry={row.data}
                            pxWidth={widthPx}
                            style={{
                                ...heatStyle,
                                left: leftPx,
                                width: widthPx,
                                isPast
                            }}
                            routes={routes}
                            ferries={[row.data]}
                            partners={partners}
                            tenantSlug={tenantSlug}
                        />
                    )
                })}
        </div>
    )
}

export function ShipsGantt({ trips, ferries, routes, partners, initialDate = new Date(), heatmapConfig }: ShipsGanttProps) {
    const t = (k: string, options?: any) => typeof options?.defaultValue === 'string' ? options.defaultValue : k;
    const i18n = { language: 'en' }; // Mock i18n object
    const locale = enUS

    const searchParams = useSearchParams()
    const { tenantSlug } = useParams() as { tenantSlug: string }
    const [headerDate, setHeaderDate] = useState(initialDate)
    const [viewMode, setViewMode] = useState<ViewMode>('day')
    const [zoomLevel, setZoomLevel] = useState(1)
    const [selectedFerryIds, setSelectedFerryIds] = useState<string[]>(ferries.map(f => f.id))
    const [isSplitByRoute, setIsSplitByRoute] = useState(false)
    const [now, setNow] = useState(new Date())
    const [startHour, setStartHour] = useState(0)
    const [endHour, setEndHour] = useState(24)

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (ferries.length > 0 && selectedFerryIds.length === 0) {
            setSelectedFerryIds(ferries.map(f => f.id))
        }
    }, [ferries])

    const toggleFerry = (id: string) => {
        setSelectedFerryIds(prev =>
            prev.includes(id)
                ? prev.length > 1 ? prev.filter(fi => fi !== id) : prev
                : [...prev, id]
        )
    }

    const selectAllFerries = () => setSelectedFerryIds(ferries.map(f => f.id))
    const unselectAllFerries = () => setSelectedFerryIds([])

    const visibleFerries = useMemo(() => {
        if (selectedFerryIds.length === 0) return ferries
        return ferries.filter(f => selectedFerryIds.some(id => String(id) === String(f.id)))
    }, [ferries, selectedFerryIds])

    const nameColumnWidth = useMemo(() => {
        const minWidth = 140
        const maxChar = Math.max(...visibleFerries.map(f => (f.name || "").length), 8)
        return Math.max(minWidth, (maxChar * 8) + 32)
    }, [visibleFerries])

    const routeColumnWidth = useMemo(() => {
        if (!isSplitByRoute) return 0
        const routeNames = routes.map(r => `${r.origin?.name} -> ${r.destination?.name}`)
        const maxChar = Math.max(...routeNames.map(n => n.length), 10)
        return Math.max(160, (maxChar * 7) + 32)
    }, [routes, isSplitByRoute])

    const sidebarWidth = nameColumnWidth + routeColumnWidth

    const BASE_HOUR_WIDTH = 90
    const hourWidth = BASE_HOUR_WIDTH * zoomLevel
    const dayWidth = (endHour - startHour) * hourWidth
    const ROW_HEIGHT = isSplitByRoute ? 80 : 140

    const daysToRender = useMemo(() => {
        if (viewMode === 'week') {
            const start = startOfWeek(headerDate, { weekStartsOn: 1 })
            return Array.from({ length: 7 }, (_, i) => addDays(start, i))
        }
        return [headerDate]
    }, [headerDate, viewMode])

    const processedRows = useMemo(() => {
        const renderStart = startOfDay(daysToRender[0])
        const renderEnd = endOfDay(daysToRender[daysToRender.length - 1])
        const rows: any[] = []

        visibleFerries.forEach(ferry => {
            if (isSplitByRoute) {
                const ferryTripsInRange = trips.filter(t =>
                    t.ferry_id === ferry.id &&
                    new Date(t.departure_time) >= renderStart &&
                    new Date(t.departure_time) <= renderEnd
                )
                const activeRouteIds = Array.from(new Set(ferryTripsInRange.map(t => t.route_id))).filter(Boolean)

                if (activeRouteIds.length > 0) {
                    activeRouteIds.forEach(routeId => {
                        const route = routes.find(r => r.id === routeId)
                        rows.push({
                            type: 'route',
                            id: `${ferry.id}-${routeId}`,
                            label: ferry.name,
                            secondColLabel: `${route?.origin?.name || '?'} → ${route?.destination?.name || '?'}`,
                            ferryId: ferry.id,
                            routeId: routeId,
                            data: ferry
                        })
                    })
                } else {
                    rows.push({ type: 'ferry', id: ferry.id, label: ferry.name, secondColLabel: '-', ferryId: ferry.id, data: ferry })
                }
            } else {
                rows.push({ type: 'ferry', id: ferry.id, label: ferry.name, ferryId: ferry.id, data: ferry })
            }
        })
        return rows
    }, [visibleFerries, isSplitByRoute, trips, daysToRender, routes])

    const mainScrollRef = useRef<HTMLDivElement>(null)
    const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const [hoverTime, setHoverTime] = useState<Date | null>(null)
    const [hoverX, setHoverX] = useState<number | null>(null)

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
    const formatDateUpdate = (newDate: Date) => setHeaderDate(newDate)
    const handlePrev = () => formatDateUpdate(addDays(headerDate, viewMode === 'day' ? -1 : -7))
    const handleNext = () => formatDateUpdate(addDays(headerDate, viewMode === 'day' ? 1 : 7))
    const handleToday = () => formatDateUpdate(new Date())

    // Calculations for Markers
    const nowPosPx = useMemo(() => {
        const todayIndex = daysToRender.findIndex(d => isSameDay(d, now))
        if (todayIndex === -1) return null

        const dayStart = startOfDay(now)
        dayStart.setHours(startHour, 0, 0, 0)

        const dayEnd = startOfDay(now)
        dayEnd.setHours(endHour, 0, 0, 0)

        if (now < dayStart || now > dayEnd) return null

        const min = differenceInMinutes(now, dayStart)
        return (todayIndex * dayWidth) + (min / 60) * hourWidth
    }, [now, daysToRender, dayWidth, hourWidth, startHour, endHour])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left + e.currentTarget.scrollLeft - sidebarWidth

        if (x < 0 || x > daysToRender.length * dayWidth) {
            setHoverX(null)
            setHoverTime(null)
            return
        }

        const totalMinutes = (x / hourWidth) * 60
        const firstDayStart = startOfDay(daysToRender[0])
        firstDayStart.setHours(startHour, 0, 0, 0)

        const hoveredDate = new Date(firstDayStart.getTime() + totalMinutes * 60000)
        setHoverTime(hoveredDate)
        setHoverX(x)
    }

    const handleMouseLeave = () => {
        setHoverX(null)
        setHoverTime(null)
    }

    useEffect(() => {
        const container = mainScrollRef.current
        if (!container) return

        if (viewMode === 'day') {
            requestAnimationFrame(() => {
                const nowDayStart = startOfDay(now)
                nowDayStart.setHours(startHour, 0, 0, 0)
                const dayIndex = daysToRender.findIndex(d => isSameDay(d, now))

                if (dayIndex !== -1) {
                    const diffInMinutes = differenceInMinutes(now, nowDayStart)
                    const todayOffsetPx = (diffInMinutes / 60) * hourWidth
                    const totalOffset = sidebarWidth + (dayIndex * dayWidth) + todayOffsetPx
                    container.scrollLeft = Math.max(0, totalOffset - (container.clientWidth * 0.5))
                }
            })
        }
    }, [dayWidth, hourWidth, viewMode, sidebarWidth, daysToRender.length])

    return (
        <div className="flex flex-col border rounded-lg bg-white shadow-sm overflow-hidden select-none h-[85vh]">
            {/* Toolbar */}
            <div className="p-4 border-b flex flex-col gap-4 bg-white z-[150] relative shadow-sm shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 border rounded p-1 bg-slate-50">
                        <Button variant="ghost" size="icon" onClick={handlePrev}><ChevronLeft size={16} /></Button>
                        <Button variant="ghost" size="sm" onClick={handleToday} className="px-4 font-bold min-w-[140px]">
                            {viewMode === 'day' ? format(headerDate, "d MMMM yyyy", { locale }) : `${format(startOfWeek(headerDate, { weekStartsOn: 1 }), "d MMM", { locale })} - ${format(endOfWeek(headerDate, { weekStartsOn: 1 }), "d MMM yyyy", { locale })}`}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNext}><ChevronRight size={16} /></Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 border-r pr-4 mr-2">
                            <input type="checkbox" id="split-routes" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={isSplitByRoute} onChange={(e) => setIsSplitByRoute(e.target.checked)} />
                            <label htmlFor="split-routes" className="text-sm font-medium whitespace-nowrap">Split by Route</label>
                        </div>

                        {/* Time Range Selector */}
                        <div className="flex items-center space-x-2 border-r pr-4 mr-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2 font-mono h-9 bg-slate-50 border-slate-200 hover:bg-white transition-colors">
                                        <Clock size={14} className="text-slate-500" />
                                        <span>{String(startHour).padStart(2, '0')}:00 - {String(endHour).padStart(2, '0')}:00</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-4 shadow-xl border-slate-200" align="end">
                                    <div className="flex flex-col gap-4">
                                        <div className="text-sm font-semibold text-slate-900">Vyberte czasowy zakres</div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] uppercase font-bold text-slate-500">Od</label>
                                                <Select value={String(startHour)} onValueChange={(v) => {
                                                    const val = parseInt(v)
                                                    if (val < endHour) setStartHour(val)
                                                }}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 24 }).map((_, i) => (
                                                            <SelectItem key={i} value={String(i)} disabled={i >= endHour}>{i}:00</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] uppercase font-bold text-slate-500">Do</label>
                                                <Select value={String(endHour)} onValueChange={(v) => {
                                                    const val = parseInt(v)
                                                    if (val > startHour) setEndHour(val)
                                                }}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 25 }, (_, i) => i).map((i) => (
                                                            <SelectItem key={i} value={String(i)} disabled={i <= startHour}>{i}:00</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        {endHour - startHour < 4 && (
                                            <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 italic">
                                                Tip: Very narrow ranges might feel restrictive.
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center border rounded bg-slate-50 mr-2">
                            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}><ZoomOut size={16} /></Button>
                            <span className="text-xs font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 2.5}><ZoomIn size={16} /></Button>
                        </div>
                        <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
                            <SelectTrigger className="w-[120px] bg-slate-50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">{t('admin.calendar.day', { defaultValue: 'Day View' })}</SelectItem>
                                <SelectItem value="week">{t('admin.calendar.week', { defaultValue: 'Week View' })}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={selectedFerryIds.length === ferries.length ? unselectAllFerries : selectAllFerries} className={cn("gap-1 h-7 text-xs", selectedFerryIds.length === ferries.length && "bg-blue-100 border-blue-300")}>
                        {selectedFerryIds.length === ferries.length ? t('admin.fleet.schedule.unselectAll', 'Unselect All') : t('admin.fleet.schedule.selectAll', 'Select All Ships')}
                    </Button>
                    {ferries.map(ferry => (
                        <Button key={ferry.id} variant="outline" size="sm" onClick={() => toggleFerry(ferry.id)} className={cn("gap-1 h-7 text-xs", selectedFerryIds.includes(ferry.id) ? "bg-blue-50 border-blue-300 text-blue-700" : "text-slate-500")}>
                            <Ship size={12} />{ferry.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Scrollable Container */}
            <div
                ref={mainScrollRef}
                className="flex-1 overflow-auto bg-slate-100/50 relative scrollbar-visible"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div className="min-w-max flex flex-col relative">
                    {/* Header Row */}
                    <div className="flex sticky top-0 z-[100] h-16 border-b bg-gray-50 shadow-sm">
                        {/* Sidebar Header */}
                        <div style={{ width: `${sidebarWidth}px` }} className="sticky left-0 z-[140] bg-gray-50 flex border-r border-gray-200">
                            <div style={{ width: `${nameColumnWidth}px` }} className="border-r border-gray-200 flex flex-col">
                                <div className="h-8 border-b border-gray-200/50" />
                                <div className="h-8 flex items-center px-4 font-bold text-sm text-slate-700">{t('admin.fleet.table.name')}</div>
                            </div>
                            {isSplitByRoute && (
                                <div style={{ width: `${routeColumnWidth}px` }} className="flex flex-col">
                                    <div className="h-8 border-b border-gray-200/50" />
                                    <div className="h-8 flex items-center px-4 font-bold text-sm text-slate-700">Route</div>
                                </div>
                            )}
                        </div>

                        {/* Timeline Header */}
                        <div className="flex flex-1 relative">
                            {daysToRender.map(day => (
                                <div key={day.toISOString()} style={{ width: `${dayWidth}px` }} className="relative border-r border-gray-200 flex flex-col flex-shrink-0 bg-white">
                                    {/* Date Label - Robust Sticky Positioning */}
                                    <div className="h-8 border-b bg-blue-50/95 flex items-center relative">
                                        <div className="sticky flex items-center gap-2 whitespace-nowrap pl-4 pr-10 z-30" style={{ left: `${sidebarWidth}px` }}>
                                            <span className="text-sm font-semibold text-blue-900">{format(day, "EEEE, d MMMM", { locale })}</span>
                                            {isSameDay(day, new Date()) && <Badge variant="secondary" className="text-xs py-0 h-5">Today</Badge>}
                                        </div>
                                    </div>
                                    {/* Hours */}
                                    <div className="flex h-8">
                                        {Array.from({ length: endHour - startHour }).map((_, i) => {
                                            const hour = startHour + i
                                            return (
                                                <div key={hour} style={{ width: `${hourWidth}px` }} className="border-r border-gray-100 flex items-center justify-center text-[10px] font-medium text-muted-foreground">{hour}:00</div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Now Marker (Red) */}
                            {nowPosPx !== null && (
                                <div className="absolute top-0 bottom-0 z-[125] pointer-events-none" style={{ left: `${nowPosPx}px` }}>
                                    <div className="flex flex-col items-center transform -translate-x-1/2 pt-1">
                                        <div className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                            {format(now, "HH:mm")}
                                        </div>
                                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-red-600"></div>
                                    </div>
                                    <div className="w-px h-full bg-red-600 border-l border-solid border-red-600" />
                                </div>
                            )}

                            {/* Hover Marker (Blue) - Higher Z-index to be on top of Now */}
                            {hoverX !== null && hoverTime && (
                                <div className="absolute top-0 bottom-0 z-[130] pointer-events-none" style={{ left: `${hoverX}px` }}>
                                    <div className="flex flex-col items-center transform -translate-x-1/2 pt-1">
                                        <div className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md">
                                            {format(hoverTime, "HH:mm")}
                                        </div>
                                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-blue-600"></div>
                                    </div>
                                    <div className="w-px h-full border-l-[2px] border-dotted border-blue-600" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Unified Rows */}
                    <div className="flex flex-col">
                        {visibleFerries.map(ferry => {
                            const ferryRows = processedRows.filter(r => r.ferryId === ferry.id)
                            if (ferryRows.length === 0) return null

                            return (
                                <div key={ferry.id} className="flex border-b-4 border-slate-300">
                                    {/* Sidebar Cell (Merged for Ferry) */}
                                    <div style={{ width: `${nameColumnWidth}px` }} className="sticky left-0 z-40 bg-white border-r border-gray-200 flex-shrink-0 flex items-center px-4 group">
                                        <div className="font-bold text-sm text-slate-900 leading-tight block truncate sticky top-20" title={ferry.name}>{ferry.name}</div>
                                    </div>

                                    {/* Route Data Area */}
                                    <div className="flex flex-col flex-1 divide-y divide-gray-200">
                                        {ferryRows.map((row) => (
                                            <div key={row.id} style={{ height: `${ROW_HEIGHT}px` }} className="flex items-stretch group/row hover:bg-slate-50/30 transition-colors">
                                                {/* Route Sidebar Part */}
                                                {isSplitByRoute && (
                                                    <div style={{ width: `${routeColumnWidth}px`, left: `${nameColumnWidth}px` }} className="sticky left-0 z-40 bg-white border-r border-gray-200 flex items-center px-4 flex-shrink-0">
                                                        <div className="text-xs text-slate-600 truncate font-medium" title={row.secondColLabel}>{row.secondColLabel}</div>
                                                    </div>
                                                )}

                                                {/* Timeline Content Part */}
                                                <div className="flex relative flex-1">
                                                    {/* Vertical Grid Lines Layer */}
                                                    <div className="absolute inset-0 flex pointer-events-none">
                                                        {daysToRender.map(d => (
                                                            <div key={d.toISOString()} style={{ width: `${dayWidth}px` }} className="h-full border-r border-gray-200/40 relative">
                                                                {Array.from({ length: endHour - startHour }).map((_, i) => (
                                                                    <div key={i} style={{ width: `${hourWidth}px`, left: `${i * hourWidth}px` }} className="absolute inset-y-0 border-r border-gray-100/30 border-dashed h-full" />
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Now Line in Row (Unified style) */}
                                                    {nowPosPx !== null && (
                                                        <div className="absolute inset-y-0 w-px bg-red-600 border-l border-solid border-red-600 z-10 pointer-events-none" style={{ left: `${nowPosPx}px` }} />
                                                    )}

                                                    {/* Hover Line in Row (Unified style) */}
                                                    {hoverX !== null && (
                                                        <div className="absolute inset-y-0 w-px border-l-[2px] border-dotted border-blue-600 z-[15] pointer-events-none" style={{ left: `${hoverX}px` }} />
                                                    )}

                                                    {/* Data Segments */}
                                                    <div className="flex h-full">
                                                        {daysToRender.map(day => (
                                                            <DayColumnBody
                                                                key={day.toISOString()}
                                                                dayDate={day}
                                                                trips={trips}
                                                                row={row}
                                                                routes={routes}
                                                                partners={partners}
                                                                startHour={startHour}
                                                                endHour={endHour}
                                                                hourWidth={hourWidth}
                                                                ROW_HEIGHT={ROW_HEIGHT}
                                                                now={now}
                                                                heatmapConfig={heatmapConfig}
                                                                tenantSlug={tenantSlug}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

