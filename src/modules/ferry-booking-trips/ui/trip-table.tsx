"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Ship, Clock, Eye, Lock, LockOpen, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getTripColorStyle } from "./trip-utils"
import { toggleTripVisibility } from "../application/actions"
import { EditTripDialog } from "./edit-trip-dialog"
import { DeleteTripButton } from "./delete-trip-button"
import { PriceEditor } from "./price-editor"
import { HeatmapThreshold } from "@/modules/core-admin-settings/domain/heatmap-config"
import { useState } from "react"
import { useParams } from "next/navigation"

interface TripTableProps {
    trips: any[]
    routes: any[]
    ferries: any[]
    partners: any[]
    heatmapConfig: any[]
    returnUrl?: string
}

export function TripTable({ trips, routes, ferries, partners, heatmapConfig, returnUrl = '/admin/t/' }: TripTableProps) {
    const t = (k: string, options?: any) => typeof options?.defaultValue === 'string' ? options.defaultValue : k;
    const [pageIndex, setPageIndex] = useState(0)
    const { tenantSlug } = useParams() as { tenantSlug: string }

    return (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead>{t('admin.trips.table.route')}</TableHead>
                        <TableHead>{t('admin.trips.table.seller')}</TableHead>
                        <TableHead>{t('admin.trips.table.ferry')}</TableHead>
                        <TableHead>{t('admin.trips.table.departure')}</TableHead>
                        <TableHead>{t('admin.trips.table.status')}</TableHead>
                        <TableHead>{t('admin.trips.table.dynamicPricing')}</TableHead>
                        <TableHead className="text-right">{t('admin.trips.table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trips?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground italic">
                                {t('admin.trips.table.noTrips')}
                            </TableCell>
                        </TableRow>
                    )}
                    {trips?.map((trip: any) => {
                        const style = getTripColorStyle(trip, heatmapConfig)
                        const borderStyle = style.backgroundColor === '#ffffff' ? 'border-b border-gray-100' : 'border-b border-white/20'

                        return (
                            <TableRow
                                key={trip.id}
                                style={{
                                    backgroundColor: style.backgroundColor,
                                    color: style.color
                                }}
                                className={`hover:opacity-90 transition-colors ${borderStyle}`}
                            >
                                <TableCell className="font-medium text-xs">
                                    {trip.route?.origin?.name} &rarr; {trip.route?.destination?.name}
                                </TableCell>
                                <TableCell className="text-xs font-medium opacity-90">
                                    {trip.seller?.name || t('admin.trips.table.defaultSeller')}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <Ship size={14} className="opacity-70" />
                                        {trip.ferry?.name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            {format(new Date(trip.departure_time), "PPP")}
                                        </div>
                                        <div className="text-xs opacity-80 flex items-center gap-1">
                                            <Clock size={12} />
                                            {format(new Date(trip.departure_time), "HH:mm")}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex gap-2 items-center">
                                            <Badge variant={trip.status === 'SCHEDULED' ? 'outline' : 'secondary'} className="bg-white/20 hover:bg-white/30 text-current border-current/20">
                                                {trip.status}
                                            </Badge>
                                            {!trip.is_public && (
                                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 rounded border border-red-200 uppercase">
                                                    {t('admin.trips.table.blocked')}
                                                </span>
                                            )}
                                            {trip.is_full && <Badge variant="destructive">FULL</Badge>}
                                        </div>
                                        <div className="text-[10px] opacity-80 whitespace-nowrap">
                                            {t('admin.trips.table.freeSeats', {
                                                count: Math.max(0, (trip.ferry?.capacity_passengers || 0) - (trip.booked_count || 0))
                                            })}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="min-w-[200px]">
                                    <div className="grid grid-cols-1 gap-1">
                                        {['ADULT', 'CHILD', 'BIKE', 'PET', 'VEHICLE'].map(type => {
                                            const p = trip.pricing?.find((p: any) => p.service_type === type)
                                            return (
                                                <PriceEditor
                                                    key={type}
                                                    tripId={trip.id}
                                                    serviceType={type}
                                                    initialPrice={p?.price || 0}
                                                    currency={p?.currency || 'PLN'}
                                                />
                                            )
                                        })}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/10 text-inherit" asChild>
                                        <Link
                                            href={`/admin/reports/manifest/${trip.id}?returnUrl=${encodeURIComponent(returnUrl)}`}
                                            title={t('common.viewManifest')}
                                        >
                                            <Eye size={16} />
                                        </Link>
                                    </Button>
                                    <button
                                        onClick={async () => await toggleTripVisibility(tenantSlug, trip.id, !trip.is_public)}
                                        className="h-8 w-8 flex items-center justify-center rounded hover:bg-black/10 text-inherit transition-colors"
                                        title={trip.is_public ? t('common.hideTrip') : t('common.showTrip')}
                                    >
                                        {trip.is_public ? <LockOpen size={16} /> : <Lock size={16} />}
                                    </button>

                                    <EditTripDialog
                                        trip={trip}
                                        routes={routes}
                                        ferries={ferries}
                                        sellers={partners}
                                        trigger={
                                            <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-black/10 text-inherit transition-colors">
                                                <Pencil size={16} />
                                            </button>
                                        }
                                    />
                                    <DeleteTripButton tripId={trip.id} className="text-inherit hover:bg-red-500 hover:text-white h-8 w-8" iconSize={16} />
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
