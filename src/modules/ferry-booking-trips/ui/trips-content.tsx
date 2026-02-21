"use client"

import { CreateTripDialog } from "./create-trip-dialog"
import { EditTripDialog } from "./edit-trip-dialog"
import { PriceEditor } from "./price-editor"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Calendar as CalendarIcon, List, Ship, Clock, Eye, Lock, LockOpen, Pencil, Plus } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ApplyTemplateDialog } from "./apply-template-dialog"


import { ShipScheduleCalendar } from "./ship-schedule-calendar"
import { ShipsGantt } from "./ships-gantt"

import { TripListFilters } from "./trip-list-filters"
import { TripTable } from "./trip-table"
import { DeleteTripButton } from "./delete-trip-button"

import { getTripColorStyle } from "./trip-utils"
import { toggleTripVisibility } from "../application/actions"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin-page-header"

import { HeatmapThreshold } from "@/modules/core-admin-settings/domain/heatmap-config"

interface TripsContentProps {
    trips: any[]
    routes: any[]
    ferries: any[]
    partners: any[]
    operationalStatuses: any[]
    templates: any[]
    heatmapConfig: HeatmapThreshold[]
}

import { useSearchParams } from "next/navigation"

export function TripsContent({ trips, routes, ferries, partners, operationalStatuses, templates, heatmapConfig }: TripsContentProps) {
    const t = (k: string, options?: any) => typeof options?.defaultValue === 'string' ? options.defaultValue : k;
    const searchParams = useSearchParams()
    const calDate = searchParams.get('calDate')
    const calView = searchParams.get('calView')
    const viewParam = searchParams.get('view')

    // Determine initial tab: if view=list is present, use list. Else default to calendar.
    const initialTab = viewParam === 'list' ? 'list' : 'calendar'

    return (
        <Tabs defaultValue={initialTab} className="w-full max-w-none space-y-6">
            <div className="flex items-start justify-between">
                <AdminPageHeader
                    titleKey="admin.trips.title"
                    subtitleKey="admin.trips.subtitle"
                />
                <div className="flex items-center gap-2">
                    <ApplyTemplateDialog templates={templates} ferries={ferries} />
                    <CreateTripDialog
                        routes={routes}
                        ferries={ferries}
                        sellers={partners}
                        trigger={
                            <Button className="gap-2">
                                <Plus size={16} />
                                {t('admin.trips.scheduleTrip')}
                            </Button>
                        }
                    />
                    <TabsList className="bg-slate-100 p-1 border shadow-sm h-10 ml-2">
                        <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <CalendarIcon size={16} />
                            {t('admin.trips.calendarView')}
                        </TabsTrigger>
                        <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <List size={16} />
                            {t('admin.trips.listView')}
                        </TabsTrigger>
                        <TabsTrigger value="gantt" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Clock size={16} />
                            {t('admin.trips.ganttView', { defaultValue: 'Gantt' })}
                        </TabsTrigger>
                    </TabsList>
                </div>
            </div>

            <TabsContent value="calendar" className="mt-0">
                <ShipScheduleCalendar
                    ferries={ferries}
                    trips={trips}
                    operationalStatuses={operationalStatuses}
                    routes={routes}
                    templates={templates}
                    sellers={partners}
                    heatmapConfig={heatmapConfig}
                    initialDate={calDate ? new Date(calDate) : undefined}
                    initialView={calView as any}
                />

            </TabsContent>

            <TabsContent value="gantt" className="mt-0">
                <ShipsGantt
                    trips={trips}
                    ferries={ferries}
                    routes={routes}
                    partners={partners}
                    heatmapConfig={heatmapConfig}
                    initialDate={calDate ? new Date(calDate) : undefined}
                />
            </TabsContent>

            <TabsContent value="list" className="mt-0">
                <TripListFilters ferries={ferries} routes={routes} />
                <TripTable
                    trips={trips}
                    routes={routes}
                    ferries={ferries}
                    partners={partners}
                    heatmapConfig={heatmapConfig}
                />
            </TabsContent>
        </Tabs>
    )
}
