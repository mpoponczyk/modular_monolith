'use client'

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface TripListFiltersProps {
    ferries: any[]
    routes: any[]
}

export function TripListFilters({ ferries, routes }: TripListFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [ferryId, setFerryId] = useState(searchParams.get('ferryId') || 'all')
    const [routeId, setRouteId] = useState(searchParams.get('routeId') || 'all')
    const [date, setDate] = useState(searchParams.get('date') || '')

    useEffect(() => {
        const params = new URLSearchParams()
        if (ferryId && ferryId !== 'all') params.set('ferryId', ferryId)
        if (routeId && routeId !== 'all') params.set('routeId', routeId)
        if (date) params.set('date', date)

        const queryString = params.toString()
        router.push(queryString ? `?${queryString}` : window.location.pathname)
    }, [ferryId, routeId, date, router])

    const clearFilters = () => {
        setFerryId('all')
        setRouteId('all')
        setDate('')
        router.push(window.location.pathname)
    }

    const hasFilters = ferryId !== 'all' || routeId !== 'all' || date !== ''

    return (
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-lg border mb-4">
            <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-500">Ferry</label>
                <Select value={ferryId} onValueChange={setFerryId}>
                    <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="All Ferries" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Ferries</SelectItem>
                        {ferries.map(ferry => (
                            <SelectItem key={ferry.id} value={ferry.id}>{ferry.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-500">Route</label>
                <Select value={routeId} onValueChange={setRouteId}>
                    <SelectTrigger className="w-[220px] bg-white">
                        <SelectValue placeholder="All Routes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Routes</SelectItem>
                        {routes.map(route => (
                            <SelectItem key={route.id} value={route.id}>
                                {typeof route.origin === 'object' ? route.origin.name : 'Origin'} &rarr; {typeof route.destination === 'object' ? route.destination.name : 'Destination'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-500">Date</label>
                <Input
                    type="date"
                    className="w-[160px] bg-white"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            {hasFilters && (
                <div className="grid gap-1">
                    <label className="text-xs font-semibold text-transparent select-none">Action</label>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                        <X size={16} className="mr-1" /> Clear
                    </Button>
                </div>
            )}
        </div>
    )
}
