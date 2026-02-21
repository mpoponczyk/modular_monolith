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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { applyTemplate } from "../application/actions"
import { Checkbox } from "@/components/ui/checkbox"

export function ApplyTemplateDialog({
    templates,
    ferries
}: {
    templates: any[],
    ferries: any[]
}) {
    const t = (k: string, options?: any) => typeof options?.defaultValue === 'string' ? options.defaultValue : k;
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<{ success: boolean, error?: string } | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setReport(null)

        try {
            const templateId = formData.get("template_id") as string
            const ferryId = formData.get("ferry_id") as string
            const startDate = formData.get("start_date") as string
            const endDate = formData.get("end_date") as string
            const overwrite = formData.get("overwrite") === "on"

            if (!startDate || !endDate) throw new Error("Dates required")

            // Generate array of dates
            const start = new Date(startDate)
            const end = new Date(endDate)
            const dates = []
            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                dates.push(new Date(d))
            }

            const result = await applyTemplate(templateId, ferryId, dates, overwrite)
            if (result.success) {
                setOpen(false)
            } else {
                setReport({ success: false, error: result.error })
            }
        } catch (e: any) {
            setReport({ success: false, error: e.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <CalendarIcon size={16} />
                    {t('admin.trips.applyTemplate')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Apply Schedule Template</DialogTitle>
                    <DialogDescription>
                        Generate trips for a date range.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Template</Label>
                        <Select name="template_id" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose template..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Assign to Ferry</Label>
                        <Select name="ferry_id" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose ferry..." />
                            </SelectTrigger>
                            <SelectContent>
                                {ferries.map(f => (
                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Start Date</Label>
                            <Input type="date" name="start_date" required />
                        </div>
                        <div className="grid gap-2">
                            <Label>End Date</Label>
                            <Input type="date" name="end_date" required />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="overwrite" name="overwrite" />
                        <label
                            htmlFor="overwrite"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Overwrite existing trips (if no reservations)
                        </label>
                    </div>

                    {report && !report.success && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                            Error: {report.error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Trips
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
