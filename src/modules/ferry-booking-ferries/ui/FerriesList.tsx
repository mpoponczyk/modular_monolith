"use client"

import Link from "next/link"
import { CreateFerryDialog } from "./CreateFerryDialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ship, Trash2, Pencil } from "lucide-react"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Switch } from "@/components/ui/switch"
import { deleteFerryAction, toggleFerryStatusAction } from "../application/actions"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { useParams } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Ferry } from "../domain/ferry-types"

export default function FerriesList({ ferries, dict }: { ferries: Ferry[], dict: any }) {
    const [isPending, startTransition] = useTransition()
    const params = useParams()
    const tenantSlug = params.slug?.[0] as string || 'test-tenant'

    const [ferryToDelete, setFerryToDelete] = useState<string | null>(null)

    const handleDelete = (id: string) => {
        setFerryToDelete(id)
    }

    const confirmDelete = () => {
        if (!ferryToDelete) return
        startTransition(async () => {
            try {
                await deleteFerryAction(tenantSlug, ferryToDelete)
                setFerryToDelete(null)
            } catch (error: any) {
                alert(`Error: ${error.message || error}`)
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <AdminPageHeader
                    title={dict.fleet?.title || "Fleet"}
                    description={dict.fleet?.subtitle || "Manage Fleet"}
                />
                <CreateFerryDialog dict={dict} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{dict.fleet?.totalShips || "Total Ships"}</CardTitle>
                        <Ship className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ferries?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{dict.fleet?.table?.name || "Name"}</TableHead>
                            <TableHead>{dict.fleet?.table?.passengerCap || "Passengers"}</TableHead>
                            <TableHead>{dict.fleet?.table?.carCap || "Cars"}</TableHead>
                            <TableHead>{dict.fleet?.table?.petCap || "Pets"}</TableHead>
                            <TableHead className="text-right">{dict.fleet?.table?.actions || "Actions"}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ferries?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    {dict.fleet?.table?.noShips || "No Ships"}
                                </TableCell>
                            </TableRow>
                        )}
                        {ferries?.map((ferry) => (
                            <TableRow key={ferry.id} className={!ferry.is_active ? "bg-slate-100 text-muted-foreground" : ""}>
                                <TableCell className="font-medium">
                                    {ferry.name}
                                </TableCell>
                                <TableCell>{ferry.capacity_passengers || ferry.capacity_pax}</TableCell>
                                <TableCell>{ferry.capacity_bikes || ferry.capacity_cars}</TableCell>
                                <TableCell>{ferry.capacity_pets}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium ${ferry.is_active ? "text-green-600" : "text-slate-400"}`}>
                                                {ferry.is_active ? dict.common?.active || "Active" : dict.common?.inactive || "Inactive"}
                                            </span>
                                            <Switch
                                                checked={ferry.is_active}
                                                onCheckedChange={(checked) => {
                                                    startTransition(async () => {
                                                        await toggleFerryStatusAction(tenantSlug, ferry.id, checked)
                                                    })
                                                }}
                                                disabled={isPending}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/admin/t/${tenantSlug}/apps/ferry-booking/ferries/${ferry.id}`}
                                                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                                                title={dict.fleet?.table?.manageZones || "Manage Zones"}
                                            >
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Pencil size={14} />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(ferry.id)}
                                                disabled={isPending}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!ferryToDelete} onOpenChange={(open) => !open && setFerryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dict.common?.confirmDelete || "Confirm Delete"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dict.common?.confirmDeleteText || "Are you sure you want to delete this ship?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>{dict.common?.cancel || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isPending}
                            onClick={(e) => {
                                e.preventDefault()
                                confirmDelete()
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isPending ? (dict.common?.loading || "...") : (dict.common?.delete || "Delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
