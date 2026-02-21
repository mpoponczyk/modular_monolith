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
import { Textarea } from "@/components/ui/textarea"
import { createTemplate } from "../application/actions"
import { useState } from "react"
import { Plus } from "lucide-react"

export function TemplateDialog({ tenantSlug }: { tenantSlug: string }) {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        formData.append('tenantSlug', tenantSlug)
        await createTemplate(formData)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus size={16} />
                    New Template
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Schedule Template</DialogTitle>
                    <DialogDescription>
                        Define a reusable set of route schedules for a day.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Weekdays High Season"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Optional description"
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Create Template</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
