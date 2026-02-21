'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users } from "lucide-react"

interface CustomersContentProps {
    tenantSlug: string
    customers: any[]
}

export function CustomersContent({ tenantSlug, customers }: CustomersContentProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Klienci</h2>
                    <p className="text-muted-foreground">Baza danych pasażerów i klientów indywidualnych.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users size={20} className="text-slate-500" />
                        Lista Klientów
                    </CardTitle>
                    <CardDescription>
                        Przegląd klientów zarejestrowanych w systemie.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(!customers || customers.length === 0) ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                            Brak dodanych klientów w systemie.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {customers.map(c => (
                                <div key={c.id} className="p-4 border rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{c.first_name} {c.last_name}</p>
                                        <p className="text-sm text-slate-500">{c.email}</p>
                                    </div>
                                    <div className="text-sm text-right">
                                        <p className="text-slate-500">Tel: {c.phone || '-'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
