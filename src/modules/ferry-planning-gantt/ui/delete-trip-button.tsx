'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteTrip } from "../application/actions"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"

export function DeleteTripButton({ tripId, className, iconSize = 16 }: { tripId: string, className?: string, iconSize?: number }) {
    const [loading, setLoading] = useState(false)
    const t = (k: string, options?: any) => typeof options?.defaultValue === 'string' ? options.defaultValue : k;
    const { tenantSlug } = useParams() as { tenantSlug: string }

    async function handleDelete() {
        if (!confirm(t('common.confirmDelete'))) return

        setLoading(true)
        const result = await deleteTrip(tenantSlug, tripId)
        setLoading(false)

        if (result?.error) {
            alert(result.error)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("text-red-500 hover:text-red-700 hover:bg-red-50", className)}
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? <Loader2 size={iconSize} className="animate-spin" /> : <Trash2 size={iconSize} />}
        </Button>
    )
}
