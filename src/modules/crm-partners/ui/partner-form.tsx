'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createPartnerAction, updatePartnerAction } from "../application/actions"

export function PartnerForm({ tenantSlug, trigger, partner }: { tenantSlug: string, trigger: React.ReactNode, partner?: any }) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form action={async (formData) => {
                    startTransition(async () => {
                        try {
                            if (partner?.id) {
                                await updatePartnerAction(tenantSlug, partner.id, formData);
                            } else {
                                await createPartnerAction(tenantSlug, formData);
                            }
                            setOpen(false);
                        } catch (e: any) {
                            alert(e.message || "An error occurred");
                        }
                    });
                }}>
                    <DialogHeader>
                        <DialogTitle>{partner ? 'Edytuj Partnera' : 'Dodaj Nowego Kontrahenta'}</DialogTitle>
                        <DialogDescription>
                            Skonfiguruj dane dla sprzedawców (wystawiających faktury) lub stałych kupujących.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nazwa firmy</Label>
                            <Input id="name" name="name" defaultValue={partner?.name} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Typ</Label>
                            <div className="col-span-3">
                                <Select name="type" defaultValue={partner?.type || 'SELLER'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wybierz typ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SELLER">SELLER (Sprzedawca)</SelectItem>
                                        <SelectItem value="BUYER">BUYER (Kupujący)</SelectItem>
                                        <SelectItem value="BOTH">OBA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nip" className="text-right">NIP</Label>
                            <Input id="nip" name="nip" defaultValue={partner?.nip} className="col-span-3" placeholder="np. 123-456-78-90" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={partner?.email} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Adres</Label>
                            <Input id="address" name="address" defaultValue={partner?.address} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="postal_code" className="text-right">Kod</Label>
                                <Input id="postal_code" name="postal_code" defaultValue={partner?.postalCode || partner?.postal_code} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="city" className="text-right ml-4">Miasto</Label>
                                <Input id="city" name="city" defaultValue={partner?.city} className="col-span-3" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Zapisywanie...' : 'Zapisz'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
