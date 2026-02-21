'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { addZoneAction } from "../application/actions"
import { useParams } from "next/navigation"

export function AddZoneForm({ ferryId }: { ferryId: string }) {
    const [loading, setLoading] = useState(false)
    const params = useParams()
    const tenantSlug = params.slug?.[0] as string || 'test-tenant'

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await addZoneAction(tenantSlug, ferryId, formData)
            const form = document.querySelector('form#add-zone-form') as HTMLFormElement
            if (form) form.reset()
        } catch (error: any) {
            alert(`Error adding zone: ${error.message || error}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form id="add-zone-form" action={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Zone Name</label>
                    <Input name="name" placeholder="e.g. VIP Lounge" required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Capacity</label>
                    <Input name="capacity" type="number" placeholder="40" required />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Description (Optional)</label>
                <Textarea name="description" placeholder="Description of zone amenities..." />
            </div>
            <Button type="submit" className="w-fit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus size={16} className="mr-2" />}
                Add Zone
            </Button>
        </form>
    )
}
