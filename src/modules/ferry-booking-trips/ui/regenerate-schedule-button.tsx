'use client'

import { useState } from "react"
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
import { Loader2, RefreshCw } from "lucide-react"
import { regenerateSchedule } from "../application/actions"

export function RegenerateScheduleButton() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Current date default
    const now = new Date()
    const currentYear = now.getFullYear()
    const nextMonth = now.getMonth() + 2 // 1-indexed next month (e.g. if now is Feb(1), next is Mar(2))

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        try {
            const year = parseInt(formData.get("year") as string)
            const month = parseInt(formData.get("month") as string)

            await regenerateSchedule(year, month)
            setOpen(false)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                    <RefreshCw size={16} />
                    Regenerate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Regenerate Schedule</DialogTitle>
                    <DialogDescription>
                        This will DELETE all future trips in the selected month and recreate them based on current templates.
                        <br /><br />
                        <span className="font-bold text-red-600">Warning: Existing reservations might be affected if trips are deleted.</span>
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Year</Label>
                            <Select name="year" defaultValue={currentYear.toString()}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                                    <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Month</Label>
                            <Select name="month" defaultValue={nextMonth > 12 ? "1" : nextMonth.toString()}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <SelectItem key={m} value={m.toString()}>
                                            {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                            Error: {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading} variant="destructive">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Regenerate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
