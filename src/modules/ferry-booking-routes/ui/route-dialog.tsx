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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createRouteAction, updateRouteAction } from "../application/actions"
import { useState } from "react"
import { Plus, Pencil } from "lucide-react"
import { useParams } from "next/navigation"



export function RouteDialog({
    route,
    mode = 'create',
    locations = [],
    ferries = []
}: {
    route?: any,
    mode?: 'create' | 'edit',
    locations: any[],
    ferries: any[]
}) {
    const t = (key: string) => key;
    const [open, setOpen] = useState(false)
    const params = useParams();

    async function handleSubmit(formData: FormData) {
        formData.append('tenantSlug', params.tenantSlug as string);
        let result
        if (mode === 'edit' && route?.id) {
            result = await updateRouteAction(route.id, formData)
        } else {
            result = await createRouteAction(formData)
        }

        if (result?.success) {
            setOpen(false)
        } else if (result?.error) {
            alert(`${t('common.error')}: ${result.error}`)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === 'create' ? (
                    <Button className="gap-2">
                        <Plus size={16} />
                        {t('admin.routes.form.addTitle')}
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon">
                        <Pencil size={16} className="text-blue-500" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? t('admin.routes.form.addTitle') : t('admin.routes.form.editTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('admin.routes.form.description')}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="origin_id" className="text-right text-xs">{t('admin.routes.form.origin')}</Label>
                        <div className="col-span-3">
                            <Select name="origin_id" defaultValue={route?.origin_id} required>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.routes.form.placeholders.origin')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="destination_id" className="text-right text-xs">{t('admin.routes.form.destination')}</Label>
                        <div className="col-span-3">
                            <Select name="destination_id" defaultValue={route?.destination_id} required>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.routes.form.placeholders.destination')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ferry_id" className="text-right text-xs text-blue-600 font-bold">{t('admin.routes.form.ship')}</Label>
                        <div className="col-span-3">
                            <Select name="ferry_id" defaultValue={route?.ferry_id || "none"}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.routes.form.shipOptional')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('admin.routes.form.noShip')}</SelectItem>
                                    {ferries.map(f => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right text-xs">{t('admin.routes.form.duration')}</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="duration"
                                name="duration"
                                type="number"
                                defaultValue={route?.estimated_duration_minutes}
                                placeholder={t('admin.routes.form.placeholders.duration')}
                                required
                            />
                            <span className="text-xs text-muted-foreground">min</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="is_standard" className="text-right text-xs">{t('admin.routes.form.isStandard')}</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="is_standard"
                                name="is_standard"
                                type="checkbox"
                                defaultChecked={route?.is_standard}
                                className="h-4 w-4"
                            />
                            <span className="text-xs text-muted-foreground">{t('admin.routes.form.isStandardDesc')}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit">{t('admin.routes.form.save')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
