'use client'

import { useState } from "react"
import { Ship, ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ManifestCalendar from "./manifest-calendar"
import { cn } from "@/lib/utils"

import { useTranslation } from "@/shared/i18n/client"

export function ShipSelectionFlow({ ferries, tenantSlug }: { ferries: any[], tenantSlug: string }) {
    const { t } = useTranslation()
    const [selectedShipId, setSelectedShipId] = useState<string | null>(null)

    // Find full ferry object for display
    const selectedShip = ferries.find(f => f.id === selectedShipId)

    if (selectedShipId) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 border-b pb-4">
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedShipId(null)}
                        className="gap-2 pl-0 hover:pl-2 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('admin.manifest.selection.back')}
                    </Button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <Ship className="h-5 w-5 text-blue-600" />
                        {selectedShip?.name}
                    </div>
                </div>

                <ManifestCalendar preSelectedShipId={selectedShipId} tenantSlug={tenantSlug} />
            </div>
        )
    }

    // Step 1: Select Ship
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ferries.map(ferry => (
                <button
                    key={ferry.id}
                    onClick={() => setSelectedShipId(ferry.id)}
                    className={cn(
                        "flex items-center gap-4 p-6 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-400 group text-left",
                    )}
                >
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Ship className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">{ferry.name}</h3>
                        <p className="text-sm text-slate-500">
                            {ferry.capacity_passengers} {t('admin.manifest.selection.passengers')}
                        </p>
                    </div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </button>
            ))}
        </div>
    )
}
