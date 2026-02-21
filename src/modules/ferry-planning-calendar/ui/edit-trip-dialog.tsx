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
import { updateTrip } from "../application/actions"
import { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useParams } from "next/navigation"

export function EditTripDialog({
    trip,
    routes,
    ferries,
    sellers,
    trigger
}: {
    trip: any,
    routes: any[],
    ferries: any[],
    sellers: any[],
    trigger?: React.ReactNode
}) {
    const [open, setOpen] = useState(false)
    const { tenantSlug } = useParams() as { tenantSlug: string }
    const [selectedFerryId, setSelectedFerryId] = useState<string>(trip.ferry_id)
    const [selectedZones, setSelectedZones] = useState<string[]>([])

    // Initialize zones from trip config
    useEffect(() => {
        if (trip.zone_config?.active_zones) {
            setSelectedZones(trip.zone_config.active_zones)
        } else {
            // Fallback or empty
            setSelectedZones([])
        }
    }, [trip])

    // Update zones when ferry changes
    const handleFerryChange = (ferryId: string) => {
        setSelectedFerryId(ferryId)
        // If changing ferry, reset zones? Or try to keep if ids match?
        // Safest to reset or default to all if different ferry
        if (ferryId !== trip.ferry_id) {
            const ferry = ferries.find(f => f.id === ferryId)
            if (ferry?.zones) {
                setSelectedZones(ferry.zones.map((z: any) => z.id))
            } else {
                setSelectedZones([])
            }
        }
    }

    const toggleZone = (zoneId: string, checked: boolean) => {
        if (checked) {
            setSelectedZones([...selectedZones, zoneId])
        } else {
            setSelectedZones(selectedZones.filter(id => id !== zoneId))
        }
    }

    async function handleSubmit(formData: FormData) {
        const rawDate = formData.get("departure_time") as string
        if (rawDate) {
            const dateObj = new Date(rawDate)
            formData.set("departure_time", dateObj.toISOString())
        }

        const zoneConfig = {
            active_zones: selectedZones
        }
        formData.set("zone_config", JSON.stringify(zoneConfig))

        await updateTrip(trip.id, formData)
        setOpen(false)
    }

    // Format ISO to local input datetime string
    const departureLocal = new Date(new Date(trip.departure_time).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)

    const selectedFerry = ferries.find(f => f.id === selectedFerryId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-800">
                        <Pencil size={14} />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Trip</DialogTitle>
                    <DialogDescription>
                        Modify schedule details.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="tenantSlug" value={tenantSlug} />
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="route" className="text-right">Route</Label>
                        <div className="col-span-3">
                            <Select name="route_id" defaultValue={trip.route_id} required>
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
                            <Select name="seller_id" defaultValue={trip.seller_id} required>
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
                                <div className="text-xs text-muted-foreground mb-2">Select active zones:</div>
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
                            defaultValue={departureLocal}
                            className="col-span-3"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit">Update Trip</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
