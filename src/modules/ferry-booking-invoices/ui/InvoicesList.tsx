'use client'

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadInvoicePdfAction } from "../application/actions"

export function InvoicesList({ tenantSlug, invoices, dict }: { tenantSlug: string, invoices: any[], dict: any }) {
    const [loadingPdf, setLoadingPdf] = useState<string | null>(null)

    const handleDownload = async (invoiceId: string) => {
        setLoadingPdf(invoiceId)
        try {
            const res = await downloadInvoicePdfAction(tenantSlug, invoiceId)
            if (res.success && res.pdfBase64) {
                const link = document.createElement('a')
                link.href = `data:application/pdf;base64,${res.pdfBase64}`
                link.download = res.filename || 'invoice.pdf'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } else {
                alert("Failed to generate invoice: " + (res.error || "Unknown error"))
            }
        } catch (e: any) {
            alert("Error downloading invoice: " + e.message)
        } finally {
            setLoadingPdf(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{dict?.admin?.invoicesPage?.title || "Issued Invoices"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{dict?.admin?.invoicesPage?.table?.invoiceNo || "Invoice No"}</TableHead>
                            <TableHead>{dict?.admin?.invoicesPage?.table?.date || "Date"}</TableHead>
                            <TableHead>{dict?.admin?.invoicesPage?.table?.customer || "Customer"}</TableHead>
                            <TableHead>{dict?.admin?.invoicesPage?.table?.amount || "Amount"}</TableHead>
                            <TableHead className="text-right">{dict?.admin?.invoicesPage?.table?.actions || "Actions"}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!invoices || invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground italic">
                                    {dict?.admin?.invoicesPage?.table?.noInvoices || "No invoices found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => {
                                const order = inv.order || {}
                                const reservations = order.reservations || []
                                const trip = reservations[0]?.trip || {}

                                return (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-mono text-xs">
                                            {inv.invoice_number}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(inv.issue_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{order.customer_email || dict?.common?.guest || "Guest"}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {trip.route?.origin?.name || '?'} &rarr; {trip.route?.destination?.name || '?'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {inv.total_amount} {inv.currency || 'PLN'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => handleDownload(inv.id)}
                                                disabled={loadingPdf === inv.id}
                                            >
                                                {loadingPdf === inv.id ? (
                                                    <span className="animate-spin">⌛</span>
                                                ) : (
                                                    <Download size={14} />
                                                )}
                                                {dict?.common?.pdf || "PDF"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
