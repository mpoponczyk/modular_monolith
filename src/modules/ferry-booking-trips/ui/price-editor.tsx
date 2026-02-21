'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateTripPrice } from "../application/actions"
import { useState } from "react"
import { Check, X } from "lucide-react"

export function PriceEditor({ tripId, serviceType, initialPrice, currency }: { tripId: string, serviceType: string, initialPrice: number, currency: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [price, setPrice] = useState(initialPrice)

    async function handleSave() {
        await updateTripPrice(tripId, serviceType, price)
        setIsEditing(false)
    }

    if (!isEditing) {
        return (
            <div className="text-sm cursor-pointer hover:bg-slate-100 px-2 py-1 rounded flex justify-between group" onClick={() => setIsEditing(true)}>
                <span>{serviceType}:</span>
                <span className="font-mono font-medium">{initialPrice} {currency}</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1 my-1">
            <span className="text-xs font-bold w-16">{serviceType}</span>
            <Input
                type="number"
                value={price}
                onChange={e => setPrice(parseFloat(e.target.value))}
                className="h-7 w-20 text-xs"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleSave}>
                <Check size={14} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => setIsEditing(false)}>
                <X size={14} />
            </Button>
        </div>
    )
}
