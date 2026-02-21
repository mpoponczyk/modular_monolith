import { getFerryDetailsAction } from "../application/actions"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Ship } from "lucide-react"
import Link from "next/link"
import { AddZoneForm } from "./add-zone-form"
import { DeleteZoneButton } from "./delete-zone-button"

export default async function FerryDetailPage({
    params
}: {
    params: Promise<{ id: string, tenantSlug: string }>
}) {
    const { id, tenantSlug } = await params
    const ferry = await getFerryDetailsAction(tenantSlug, id)

    if (!ferry) notFound()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/admin/t/${tenantSlug}/apps/ferry-booking/ferries`} className="text-sm text-blue-600 hover:underline">&larr; Back to Fleet</Link>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Ship className="text-blue-500" />
                        {ferry.name}
                    </h1>
                    <p className="text-muted-foreground">Manage capacity and zones for this ship.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Ship Capacities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Passengers</p>
                            <p className="text-2xl font-bold">{ferry.capacity_passengers || ferry.capacity_pax}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Bikes</p>
                            <p className="text-2xl font-bold">{ferry.capacity_bikes || ferry.capacity_cars}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Pets</p>
                            <p className="text-2xl font-bold">{ferry.capacity_pets || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ship Zones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Zone Name</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ferry.zones?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No zones defined for this ship.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ferry.zones?.map((zone: any) => (
                                            <TableRow key={zone.id}>
                                                <TableCell className="font-medium">{zone.name}</TableCell>
                                                <TableCell>{zone.capacity}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{zone.description || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <DeleteZoneButton zoneId={zone.id} ferryId={ferry.id} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddZoneForm ferryId={ferry.id} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
