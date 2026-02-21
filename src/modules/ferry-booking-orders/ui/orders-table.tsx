'use client'

import React, { useState } from "react"
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
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings2, Eye, MoreHorizontal, FileDown, Ban, ChevronDown, ChevronRight, FileText } from "lucide-react"
import Link from "next/link"
import { cancelOrderAction, getInvoicePdfAction } from "../application/actions"

export function OrdersTable({ tenantSlug, orders, dict }: { tenantSlug: string, orders: any[], dict: any }) {
    const COLUMNS = [
        { id: 'expand', label: '' },
        { id: 'created_at', label: dict?.admin?.ordersPage?.table?.date || 'Date' },
        { id: 'id', label: dict?.admin?.ordersPage?.table?.orderId || 'Order ID' },
        { id: 'customer', label: dict?.admin?.ordersPage?.table?.customer || 'Customer' },
        { id: 'items', label: dict?.admin?.ordersPage?.table?.items || 'Items' },
        { id: 'status', label: dict?.admin?.ordersPage?.table?.status || 'Status' },
        { id: 'amount', label: dict?.admin?.ordersPage?.table?.totalAmount || 'Amount' },
        { id: 'actions', label: dict?.admin?.ordersPage?.table?.actions || 'Actions' },
    ]

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
        created_at: true,
        id: true,
        customer: true,
        items: true,
        status: true,
        amount: true,
        actions: true,
    })
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
    const [loadingPdf, setLoadingPdf] = useState<string | null>(null)

    const isVisible = (colId: string) => columnVisibility[colId] ?? true

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setExpandedRows(newSet)
    }

    const handleDownloadInvoice = async (orderId: string) => {
        setLoadingPdf(orderId)
        try {
            const res = await getInvoicePdfAction(tenantSlug, orderId)
            if (res.success && res.pdfBase64) {
                const link = document.createElement('a')
                link.href = `data:application/pdf;base64,${res.pdfBase64}`
                link.download = res.filename || 'invoice.pdf'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } else {
                alert("Failed to generate invoice: " + res.error)
            }
        } catch (e) {
            alert("Error downloading invoice")
        } finally {
            setLoadingPdf(null)
        }
    }

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm((dict?.admin?.ordersPage?.table?.actions_label?.cancelOrder || 'Cancel Order') + "?")) return

        const res = await cancelOrderAction(tenantSlug, orderId)
        if (!res.success) {
            alert("Failed to cancel order: " + res.error)
        }
    }

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
                            column.id !== 'expand' && (
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
                            )
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            {isVisible('created_at') && <TableHead>{dict?.admin?.ordersPage?.table?.date || 'Date'}</TableHead>}
                            {isVisible('id') && <TableHead>{dict?.admin?.ordersPage?.table?.orderId || 'Order ID'}</TableHead>}
                            {isVisible('customer') && <TableHead>{dict?.admin?.ordersPage?.table?.customer || 'Customer'}</TableHead>}
                            {isVisible('items') && <TableHead className="text-center">{dict?.admin?.ordersPage?.table?.items || 'Items'}</TableHead>}
                            {isVisible('status') && <TableHead>{dict?.admin?.ordersPage?.table?.status || 'Status'}</TableHead>}
                            {isVisible('amount') && <TableHead className="text-right">{dict?.admin?.ordersPage?.table?.totalAmount || 'Amount'}</TableHead>}
                            {isVisible('actions') && <TableHead className="text-right">{dict?.admin?.ordersPage?.table?.actions || 'Actions'}</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!orders || orders.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={COLUMNS.length} className="text-center h-24 text-muted-foreground italic">
                                    {dict?.admin?.ordersPage?.table?.noOrders || 'No orders found.'}
                                </TableCell>
                            </TableRow>
                        )}
                        {orders?.map((order: any) => (
                            <React.Fragment key={order.id}>
                                <TableRow
                                    className={`cursor-pointer hover:bg-slate-50 ${expandedRows.has(order.id) ? 'bg-slate-50' : ''}`}
                                    onClick={() => toggleRow(order.id)}
                                >
                                    <TableCell>
                                        {expandedRows.has(order.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </TableCell>
                                    {isVisible('created_at') && (
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {order.createdAt ? format(new Date(order.createdAt), "dd.MM.yyyy HH:mm") : '-'}
                                        </TableCell>
                                    )}
                                    {isVisible('id') && (
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {order.id.slice(0, 8)}...
                                        </TableCell>
                                    )}
                                    {isVisible('customer') && (
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="font-medium text-sm text-slate-900">
                                                    {order.customerFirstName} {order.customerLastName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                                            </div>
                                        </TableCell>
                                    )}
                                    {isVisible('items') && (
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-white">
                                                {order.reservations ? order.reservations.length : 0} Res.
                                            </Badge>
                                        </TableCell>
                                    )}
                                    {isVisible('status') && (
                                        <TableCell>
                                            <Badge
                                                variant={order.status === 'COMPLETED' ? 'secondary' : order.status === 'CANCELLED' ? 'destructive' : 'outline'}
                                                className={order.status === 'COMPLETED' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                                            >
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    {isVisible('amount') && (
                                        <TableCell className="text-right font-bold">
                                            {order.totalAmount} PLN
                                        </TableCell>
                                    )}
                                    {isVisible('actions') && (
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDownloadInvoice(order.id)}
                                                    disabled={loadingPdf === order.id}
                                                    title={dict?.admin?.ordersPage?.table?.actions_label?.downloadInvoice || "Download Invoice"}
                                                >
                                                    {loadingPdf === order.id ? <span className="animate-spin">⌛</span> : <FileDown size={16} />}
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>{dict?.admin?.ordersPage?.table?.actions || "Actions"}</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/t/${tenantSlug}/apps/ferry-booking/orders/${order.id}`} target="_blank">
                                                                <Eye className="mr-2 h-4 w-4" /> {dict?.admin?.ordersPage?.table?.actions_label?.viewDetails || "View Details"}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                        >
                                                            <Ban className="mr-2 h-4 w-4" /> {dict?.admin?.ordersPage?.table?.actions_label?.cancelOrder || "Cancel Order"}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>

                                {expandedRows.has(order.id) && (
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableCell colSpan={COLUMNS.length + 1} className="p-0">
                                            <div className="p-4 pl-12 border-t border-b border-slate-100">
                                                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">{dict?.admin?.ordersPage?.table?.reservationsInOrder || "Reservations in Order"}</h4>
                                                <div className="space-y-2">
                                                    {order.reservations?.map((res: any) => (
                                                        <div key={res.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100 text-sm shadow-sm">
                                                            <div className="flex gap-4 items-center">
                                                                <span className="font-mono text-xs text-slate-400">#{res.id.slice(0, 8)}</span>
                                                                <span className="font-medium text-slate-700">
                                                                    Reservation Link
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-4 text-xs text-slate-500 items-center">
                                                                <span>{res.countPassengers} {dict?.admin?.ordersPage?.table?.pax || "Pax"}</span>
                                                                <span className="font-semibold text-slate-700">{res.totalAmount} PLN</span>
                                                                <Link href={`/admin/t/${tenantSlug}/apps/ferry-booking/reservations?q=${res.id}`} className="text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                                                                    {dict?.admin?.ordersPage?.table?.manage || "Manage"}
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!order.reservations || order.reservations.length === 0) && (
                                                        <div className="text-xs italic text-slate-400">No linked reservations found.</div>
                                                    )}
                                                </div>

                                                <div className="mt-4 flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(order.id)} disabled={loadingPdf === order.id}>
                                                        <FileText size={14} className="mr-2 text-slate-500" />
                                                        {loadingPdf === order.id ? (dict?.common?.loading || "Loading...") : (dict?.admin?.ordersPage?.table?.actions_label?.downloadInvoice || "Download Invoice")}
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
