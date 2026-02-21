'use client'

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { useState, useTransition } from "react"

export function ReservationFilters() {
    const paramsHook = useParams()
    const tenantSlug = paramsHook.tenantSlug as string
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initial state from URL
    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
    const [isPending, startTransition] = useTransition()

    function handleSearch(term: string) {
        setSearchTerm(term)
        // Debounce could go here, but for simplicity we'll trigger on Enter or Blur manually for now, 
        // or just useEffect. Let's do simple Enter key or Button.
    }

    function applyFilters() {
        const params = new URLSearchParams()
        if (searchTerm) params.set("q", searchTerm)
        if (statusFilter && statusFilter !== 'all') params.set("status", statusFilter)

        startTransition(() => {
            router.push(`/admin/t/${tenantSlug}/apps/ferry-booking/reservations?${params.toString()}`)
        })
    }

    function clearFilters() {
        setSearchTerm("")
        setStatusFilter("all")
        startTransition(() => {
            router.push(`/admin/t/${tenantSlug}/apps/ferry-booking/reservations`)
        })
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg border shadow-sm items-end md:items-center">

            {/* Search Input */}
            <div className="w-full md:w-1/3 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search name, email, or simple ID..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-[200px]">
                <Select value={statusFilter} onValueChange={(val) => {
                    setStatusFilter(val)
                    // Auto apply on select change
                    const params = new URLSearchParams()
                    if (searchTerm) params.set("q", searchTerm)
                    if (val && val !== 'all') params.set("status", val)
                    startTransition(() => router.push(`/admin/t/${tenantSlug}/apps/ferry-booking/reservations?${params.toString()}`))
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button onClick={applyFilters} disabled={isPending}>
                    {isPending ? "Updating..." : "Search"}
                </Button>
                {(searchTerm || statusFilter !== 'all') && (
                    <Button variant="ghost" onClick={clearFilters} disabled={isPending} title="Clear Filters">
                        <X size={16} />
                    </Button>
                )}
            </div>
        </div>
    )
}
