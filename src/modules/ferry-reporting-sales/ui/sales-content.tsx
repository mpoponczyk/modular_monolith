"use client"

import { AnalyticsCard } from "./analytics-card"
import { DollarSign, ShoppingCart } from "lucide-react"

interface SalesContentProps {
    data: any
    tenantSlug: string
}

export function SalesContent({ data }: SalesContentProps) {
    if (!data || !data.sales) {
        return <div className="p-8">Brak danych sprzedażowych.</div>
    }

    const { revenue, bookings } = data.sales

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {revenue && (
                <AnalyticsCard
                    title="Całkowity Przychód MTD"
                    value={new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(revenue.currentMtd || 0)}
                    subtitle="Względem poprzedniego miesiąca"
                    icon={<DollarSign size={24} />}
                    trend={{
                        value: `${Math.abs(revenue.momChange || 0).toFixed(1)}%`,
                        isUp: (revenue.momChange || 0) >= 0
                    }}
                    incrementLabel="Wczoraj"
                    incrementValue={`+${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(revenue.dailyIncrement || 0)}`}
                    data={revenue.trend || []}
                    className="border-blue-100 dark:border-blue-900"
                />
            )}

            {bookings && (
                <AnalyticsCard
                    title="Zamówienia MTD"
                    value={new Intl.NumberFormat('pl-PL').format(bookings.currentMtd || 0)}
                    subtitle="Rozpoczęte rezerwacje"
                    icon={<ShoppingCart size={24} />}
                    trend={{
                        value: `${Math.abs(bookings.momChange || 0).toFixed(1)}%`,
                        isUp: (bookings.momChange || 0) >= 0
                    }}
                    incrementLabel="Wczoraj"
                    incrementValue={`+${bookings.dailyIncrement || 0}`}
                    data={bookings.trend || []}
                    className="border-emerald-100 dark:border-emerald-900"
                />
            )}
        </div>
    )
}
