"use client"

import { RouteDialog } from "./route-dialog"
import { DeleteRouteButton } from "./delete-button"
import { StandardToggle } from "./standard-toggle"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Map, Ship } from "lucide-react"
import { AdminPageHeader } from "@/components/admin-page-header"

interface RoutesContentProps {
    routes: any[]
    locations: any[]
    ferries: any[]
}

export function RoutesContent({ routes, locations, ferries }: RoutesContentProps) {
    const t = (key: string) => key;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <AdminPageHeader
                    titleKey="admin.routes.title"
                    subtitleKey="admin.routes.subtitle"
                />
                <RouteDialog mode="create" locations={locations} ferries={ferries} />
            </div>


            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>{t('admin.routes.table.connection')}</TableHead>
                            <TableHead>{t('admin.routes.table.defaultShip')}</TableHead>
                            <TableHead>{t('admin.routes.table.estDuration')}</TableHead>
                            <TableHead className="text-center w-[80px]">{t('admin.routes.table.standard')}</TableHead>
                            <TableHead className="text-right">{t('admin.routes.table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {routes?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground italic">
                                    {t('admin.routes.table.noRoutes')}
                                </TableCell>
                            </TableRow>
                        )}
                        {routes?.map((route: any) => (
                            <TableRow key={route.id} className="hover:bg-blue-50/30">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{route.origin?.name}</span>
                                        <span className="text-gray-400">&rarr;</span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">{route.destination?.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {route.ferry ? (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Ship size={14} className="text-blue-500" />
                                            {route.ferry.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">{t('admin.routes.table.notAssigned')}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {Math.floor(route.estimated_duration_minutes / 60) > 0 && `${Math.floor(route.estimated_duration_minutes / 60)}h `}
                                    {route.estimated_duration_minutes % 60}m
                                </TableCell>
                                <TableCell className="text-center">
                                    <StandardToggle id={route.id} initialStatus={route.is_standard} />
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-1">
                                    <RouteDialog
                                        mode="edit"
                                        route={route}
                                        locations={locations}
                                        ferries={ferries}
                                    />
                                    <DeleteRouteButton id={route.id} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
