'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteZoneAction } from "../application/actions"
import { useParams } from "next/navigation"

export function DeleteZoneButton({ zoneId, ferryId }: { zoneId: string, ferryId: string }) {
    const [loading, setLoading] = useState(false)
    const params = useParams()
    const tenantSlug = params.slug?.[0] as string || 'test-tenant'

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this zone?")) return

        setLoading(true)
        try {
            await deleteZoneAction(tenantSlug, zoneId, ferryId)
        } catch (error: any) {
            alert(`Error deleting zone: ${error.message || error}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </Button>
    )
}
