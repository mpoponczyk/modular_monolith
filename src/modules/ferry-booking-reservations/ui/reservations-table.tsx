'use client'

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ReservationActions } from "./reservation-actions"

// Define columns order
const COLUMNS = [
    { id: 'created_at', label: 'Booked On' },
    { id: 'id', label: 'ID' },
    { id: 'order_id', label: 'Order ID' },
    { id: 'customer', label: 'Customer' },
    { id: 'trip', label: 'Trip' },
    { id: 'details', label: 'Details' },
    { id: 'status', label: 'Status' },
    { id: 'amount', label: 'Amount' },
    { id: 'notes', label: 'Notes' },
    { id: 'actions', label: 'Actions' },
]

export function ReservationsTable({ reservations }: { reservations: any[] }) {
    const params = useParams()
    const tenantSlug = params.tenantSlug as string

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
        created_at: true,
        id: true,
        order_id: true,
        customer: true,
        trip: true,
        details: true,
        status: true,
        amount: true,
        notes: true,
        actions: true,
    })

    const isVisible = (colId: string) => columnVisibility[colId] ?? true

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
                            <Settings2 className="mr-2 h-4 w-4" />
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {COLUMNS.map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={columnVisibility[column.id]}
                                onCheckedChange={(value: boolean) =>
                                    setColumnVisibility((prev) => ({ ...prev, [column.id]: value }))
                                }
                            >
                                {column.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            {isVisible('created_at') && <TableHead>Booked On</TableHead>}
                            {isVisible('id') && <TableHead>ID</TableHead>}
                            {isVisible('order_id') && <TableHead>Order</TableHead>}
                            {isVisible('customer') && <TableHead>Customer</TableHead>}
                            {isVisible('trip') && <TableHead>Trip</TableHead>}
                            {isVisible('details') && <TableHead>Details</TableHead>}
                            {isVisible('status') && <TableHead>Status</TableHead>}
                            {isVisible('amount') && <TableHead>Amount</TableHead>}
                            {isVisible('notes') && <TableHead>Notes</TableHead>}
                            {isVisible('actions') && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!reservations || reservations.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={COLUMNS.filter(c => isVisible(c.id)).length} className="text-center h-24 text-muted-foreground italic">
                                    No reservations found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                        {reservations?.map((res: any) => (
                            <TableRow key={res.id}>
                                {isVisible('created_at') && (
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {res.created_at ? format(new Date(res.created_at), "dd.MM.yyyy HH:mm") : '-'}
                                    </TableCell>
                                )}
                                {isVisible('id') && (
                                    <TableCell className="font-mono text-xs text-slate-400">
                                        {res.id.slice(0, 8)}...
                                    </TableCell>
                                )}
                                {isVisible('order_id') && (
                                    <TableCell>
                                        {res.order_id ? (
                                            <Link href={`/admin/t/${tenantSlug}/apps/ferry-booking/orders/${res.order_id}`} className="font-mono text-xs text-blue-600 hover:underline">
                                                {res.order_id.slice(0, 8)}...
                                            </Link>
                                        ) : (
                                            <span className="text-slate-300 text-xs">-</span>
                                        )}
                                    </TableCell>
                                )}
                                {isVisible('customer') && (
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="font-medium text-sm text-slate-900">
                                                {res.customer_first_name || res.customer_last_name
                                                    ? `${res.customer_first_name || ''} ${res.customer_last_name || ''}`.trim()
                                                    : "Guest"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{res.customer_email}</div>
                                            {res.phone_number && (
                                                <div className="text-xs text-slate-500 mt-0.5">📞 {res.phone_number}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                )}
                                {isVisible('trip') && (
                                    <TableCell className="text-sm">
                                        <div>{res.trip?.route?.origin?.name} &rarr; {res.trip?.route?.destination?.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(res.trip?.departure_time), "PPP p")}
                                        </div>
                                    </TableCell>
                                )}
                                {isVisible('details') && (
                                    <TableCell className="text-xs">
                                        {res.count_passengers} Pass, {res.count_bikes} Bikes, {res.count_pets} Pets
                                    </TableCell>
                                )}
                                {isVisible('status') && (
                                    <TableCell>
                                        <Badge variant={res.status === 'CONFIRMED' ? 'secondary' : 'outline'}>
                                            {res.status}
                                        </Badge>
                                    </TableCell>
                                )}
                                {isVisible('amount') && (
                                    <TableCell className="font-bold">
                                        {res.total_amount} {res.currency}
                                    </TableCell>
                                )}
                                {isVisible('notes') && (
                                    <TableCell className="text-sm max-w-[200px]">
                                        {res.notes ? (
                                            <div className="text-amber-700 italic flex items-start gap-1 p-1 bg-amber-50 rounded border border-amber-100">
                                                <span>📝</span>
                                                <span className="truncate">{res.notes}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-xs">-</span>
                                        )}
                                    </TableCell>
                                )}
                                {isVisible('actions') && (
                                    <TableCell className="text-right">
                                        <ReservationActions reservation={res} />
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
