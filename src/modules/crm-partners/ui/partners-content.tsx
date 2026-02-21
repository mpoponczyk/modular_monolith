'use client'

import { PartnerForm } from "./partner-form"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Plus, Mail, MapPin, Trash2, Filter } from "lucide-react"
import { deletePartnerAction } from "../application/actions"
import Link from "next/link"


interface PartnersContentProps {
    tenantSlug: string
    partners: any[]
    activeFilter: string
    errorMsg?: string | null
}

export function PartnersContent({ tenantSlug, partners, activeFilter, errorMsg }: PartnersContentProps) {
    return (
        <div className="space-y-6">
            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                    {errorMsg}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Partnerzy Biznesowi</h2>
                    <p className="text-muted-foreground">Zarządzaj firmami, agencjami i dostawcami</p>
                </div>
                <PartnerForm tenantSlug={tenantSlug} trigger={<Button className="gap-2"><Plus size={18} /> Dodaj Partnera</Button>} />
            </div>

            <div className="flex items-center justify-between gap-4">
                <Tabs defaultValue={activeFilter} className="w-fit">
                    <TabsList>
                        <Link href={`/admin/t/${tenantSlug}/apps/crm/partners?type=SELLER`}>
                            <TabsTrigger value="SELLER">Sprzedawcy</TabsTrigger>
                        </Link>
                        <Link href={`/admin/t/${tenantSlug}/apps/crm/partners?type=BUYER`}>
                            <TabsTrigger value="BUYER">Kupujący</TabsTrigger>
                        </Link>
                        <Link href={`/admin/t/${tenantSlug}/apps/crm/partners?type=ALL`}>
                            <TabsTrigger value="ALL">Wszyscy</TabsTrigger>
                        </Link>
                    </TabsList>
                </Tabs>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Filter size={14} />
                    Wyświetlanie partnerów ({partners?.length || 0})
                </div>
            </div>

            <div className="grid gap-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nazwa Partnera</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead>NIP</TableHead>
                            <TableHead>Lokalizacja</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {partners?.map((partner) => (
                            <TableRow key={partner.id}>
                                <TableCell>
                                    <div className="font-medium flex items-center gap-2">
                                        <Building2 size={16} className="text-slate-400" />
                                        {partner.name}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <Mail size={12} /> {partner.email || "Brak emailu"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={partner.type === 'SELLER' ? 'default' : partner.type === 'BOTH' ? 'secondary' : 'outline'}>
                                        {partner.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-sm">{partner.nip || "Brak"}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm flex items-center gap-1">
                                        <MapPin size={14} className="text-slate-400" />
                                        {partner.city || "Brak"}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <PartnerForm tenantSlug={tenantSlug} partner={partner} trigger={<Button size="sm" variant="ghost">Edytuj</Button>} />
                                        <form action={async () => {
                                            await deletePartnerAction(tenantSlug, partner.id)
                                        }}>
                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 size={16} />
                                            </Button>
                                        </form>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!partners || partners.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                    Brak dodanych partnerów.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
