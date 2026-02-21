'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTrip } from "../application/actions"
import { useState } from "react"
import { Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useParams } from "next/navigation"

export function CreateTripDialog({
    routes,
    ferries,
    sellers,
    trigger,
    defaultDate
}: {
    routes: any[],
    ferries: any[],
    sellers: any[],
    trigger?: React.ReactNode,
    defaultDate?: Date
}) {
    const t = (k: string, options?: any) => typeof options?.defaultValue === 'string' ? options.defaultValue : k;
    const [open, setOpen] = useState(false)
    const { tenantSlug } = useParams() as { tenantSlug: string }
    const [selectedFerryId, setSelectedFerryId] = useState<string>(ferries.length === 1 ? ferries[0].id : "")
    const [selectedZones, setSelectedZones] = useState<string[]>([])

    // Update zones when ferry changes
    const handleFerryChange = (ferryId: string) => {
        setSelectedFerryId(ferryId)
        const ferry = ferries.find(f => f.id === ferryId)
        // Default select all zones? Or none? Let's select all by default for convenience
        if (ferry?.zones) {
            setSelectedZones(ferry.zones.map((z: any) => z.id))
        } else {
            setSelectedZones([])
        }
    }

    const toggleZone = (zoneId: string, checked: boolean) => {
        if (checked) {
            setSelectedZones([...selectedZones, zoneId])
        } else {
            setSelectedZones(selectedZones.filter((id: string) => id !== zoneId))
        }
    }

    async function handleSubmit(formData: FormData) {
        // Timezone Fix: Convert local datetime-local input to proper ISO string with timezone
        const rawDate = formData.get("departure_time") as string
        if (rawDate) {
            const dateObj = new Date(rawDate)
            formData.set("departure_time", dateObj.toISOString())
        }

        // Add Zone Config
        const zoneConfig = {
            active_zones: selectedZones
        }
        formData.set("zone_config", JSON.stringify(zoneConfig))

        await createTrip(formData)
        setOpen(false)
    }

    const defaultDeparture = defaultDate
        ? new Date(defaultDate.getTime() - (defaultDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
        : ""

    const selectedFerry = ferries.find(f => f.id === selectedFerryId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2">
                        <Plus size={16} />
                        Schedule Trip
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('admin.trips.scheduleTrip')}</DialogTitle>
                    <DialogDescription>
                        Assign a ferry to a route at a specific time.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="tenantSlug" value={tenantSlug} />
                    {/* ... other inputs ... */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="route" className="text-right">Route</Label>
                        <div className="col-span-3">
                            <Select name="route_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Route" />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.origin?.name || r.origin} &rarr; {r.destination?.name || r.destination}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="seller" className="text-right text-blue-600 font-bold">Seller</Label>
                        <div className="col-span-3">
                            <Select name="seller_id" defaultValue={sellers?.[0]?.id} required>
                                <SelectTrigger className="border-blue-200">
                                    <SelectValue placeholder="Select Selling Entity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sellers?.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ferry" className="text-right">Ferry</Label>
                        <div className="col-span-3">
                            <Select name="ferry_id" value={selectedFerryId} onValueChange={handleFerryChange} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Ferry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ferries.map(f => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Zone Selection */}
                    {selectedFerry && selectedFerry.zones && selectedFerry.zones.length > 0 && (
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Zones</Label>
                            <div className="col-span-3 space-y-2 border rounded-md p-3">
                                <div className="text-xs text-muted-foreground mb-2">Select active zones for this trip:</div>
                                {selectedFerry.zones.map((z: any) => (
                                    <div key={z.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`zone-${z.id}`}
                                            checked={selectedZones.includes(z.id)}
                                            onCheckedChange={(checked) => toggleZone(z.id, checked as boolean)}
                                        />
                                        <label
                                            htmlFor={`zone-${z.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {z.name} <span className="text-xs text-muted-foreground">({z.capacity} pax)</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="departure" className="text-right">Departure</Label>
                        <Input
                            id="departure"
                            name="departure_time"
                            type="datetime-local"
                            defaultValue={defaultDeparture}
                            className="col-span-3"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit">{t('admin.trips.scheduleTrip')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
