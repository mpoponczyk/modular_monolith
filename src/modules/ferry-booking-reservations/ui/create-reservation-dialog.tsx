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
import { createReservation } from "../application/actions"
import { useState } from "react"
import { Plus } from "lucide-react"
import { useParams } from "next/navigation"

export function CreateReservationDialog({ trips }: { trips: any[] }) {
    const params = useParams()
    const tenantSlug = params.tenantSlug as string
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        await createReservation(formData)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus size={16} />
                    New Reservation
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Reservation</DialogTitle>
                    <DialogDescription>
                        Manually create a reservation for a customer.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="tenantSlug" value={tenantSlug} />
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="trip" className="text-right">Trip</Label>
                        <div className="col-span-3">
                            <Select name="trip_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Trip" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trips.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.route?.origin?.name} &rarr; {t.route?.destination?.name} ({new Date(t.departure_time).toLocaleString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input
                            id="email"
                            name="customer_email"
                            type="email"
                            placeholder="customer@example.com"
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="passengers" className="text-right">Passengers</Label>
                        <Input
                            id="passengers"
                            name="count_passengers"
                            type="number"
                            defaultValue="1"
                            min="1"
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bikes" className="text-right">Bikes</Label>
                        <Input
                            id="bikes"
                            name="count_bikes"
                            type="number"
                            defaultValue="0"
                            min="0"
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Phone</Label>
                        <Input
                            id="phone"
                            name="phone_number"
                            placeholder="+48..."
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right mt-2">Notes</Label>
                        <textarea
                            id="notes"
                            name="notes"
                            placeholder="Internal notes..."
                            className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit">Create Reservation</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
