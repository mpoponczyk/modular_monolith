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
import { createFerryAction } from "../application/actions"
import { useState } from "react"
import { Plus } from "lucide-react"
import { useParams } from "next/navigation"

export function CreateFerryDialog({ dict }: { dict?: any }) {
    const [open, setOpen] = useState(false)
    const params = useParams()
    const tenantSlug = params.slug?.[0] as string || 'test-tenant'

    async function handleSubmit(formData: FormData) {
        try {
            await createFerryAction(tenantSlug, formData)
            setOpen(false)
        } catch (error: any) {
            alert(error.message || "Failed to create ferry")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus size={16} />
                    Add Ferry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dict?.form?.addFerry || "Add New Ferry"}</DialogTitle>
                    <DialogDescription>
                        {dict?.form?.addFerryDescription || "Enter the details of the new ship in your fleet."}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            {dict?.form?.name || "Name"}
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Baltic Queen"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="passengers" className="text-right">
                            {dict?.form?.passengers || "Passengers"}
                        </Label>
                        <Input
                            id="passengers"
                            name="capacity_passengers"
                            type="number"
                            defaultValue="200"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bikes" className="text-right">
                            {dict?.form?.bikes || "Bikes"}
                        </Label>
                        <Input
                            id="bikes"
                            name="capacity_bikes"
                            type="number"
                            defaultValue="50"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pets" className="text-right">
                            {dict?.form?.pets || "Pet Capacity"}
                        </Label>
                        <Input
                            id="pets"
                            name="capacity_pets"
                            type="number"
                            defaultValue="10"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">{dict?.common?.save || "Save changes"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
