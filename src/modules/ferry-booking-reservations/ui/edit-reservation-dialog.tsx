'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateReservation } from "../application/actions"
import { Pencil } from "lucide-react"
import { useParams } from "next/navigation"

export function EditReservationDialog({ reservation, trigger }: { reservation: any, trigger?: React.ReactNode }) {
    const params = useParams()
    const tenantSlug = params.tenantSlug as string
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        await updateReservation(formData)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:text-blue-800">
                        <Pencil size={12} />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Reservation</DialogTitle>
                    <DialogDescription>
                        Update details for reservation #{reservation.id.slice(0, 8)}
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="tenantSlug" value={tenantSlug} />
                    <input type="hidden" name="id" value={reservation.id} />

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <div className="col-span-3">
                            <Select name="status" defaultValue={reservation.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input
                            id="email"
                            name="customer_email"
                            defaultValue={reservation.customer_email || ''}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="first_name" className="text-right">First Name</Label>
                        <Input
                            id="first_name"
                            name="customer_first_name"
                            defaultValue={reservation.customer_first_name || ''}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="last_name" className="text-right">Last Name</Label>
                        <Input
                            id="last_name"
                            name="customer_last_name"
                            defaultValue={reservation.customer_last_name || ''}
                            className="col-span-3"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Phone</Label>
                        <Input
                            id="phone"
                            name="phone_number"
                            defaultValue={reservation.phone_number || ''}
                            placeholder="+48..."
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="passengers" className="text-right">Passengers</Label>
                        <Input
                            id="passengers"
                            name="count_passengers"
                            type="number"
                            min="1"
                            defaultValue={reservation.count_passengers}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bikes" className="text-right">Bikes</Label>
                        <Input
                            id="bikes"
                            name="count_bikes"
                            type="number"
                            min="0"
                            defaultValue={reservation.count_bikes}
                            className="col-span-3"
                        />
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right mt-2">Notes</Label>
                        <textarea
                            id="notes"
                            name="notes"
                            defaultValue={reservation.notes || ''}
                            placeholder="Internal admin notes..."
                            className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded text-center">
                        Warning: Changing counts will recalculate the total price.
                    </div>

                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
