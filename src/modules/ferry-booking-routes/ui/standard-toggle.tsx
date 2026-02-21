'use client'

import { useState } from "react"
import { updateRouteStatusAction } from "../application/actions"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

export function StandardToggle({
    id,
    initialStatus
}: {
    id: string,
    initialStatus: boolean
}) {
    const t = (key: string) => key;
    const params = useParams();
    const [isStandard, setIsStandard] = useState(initialStatus)
    const [loading, setLoading] = useState(false)

    async function handleToggle() {
        setLoading(true)
        const nextStatus = !isStandard
        // Optimistic update
        setIsStandard(nextStatus)
        try {
            await updateRouteStatusAction(params.tenantSlug as string, id, nextStatus)
        } catch (e) {
            // Rollback on error
            setIsStandard(isStandard)
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className="focus:outline-none transition-transform active:scale-95"
            title={isStandard ? t('admin.routes.actions.removeStandard') : t('admin.routes.actions.addStandard')}
        >
            {loading ? (
                <Loader2 size={18} className="animate-spin text-slate-300" />
            ) : isStandard ? (
                <span className="text-yellow-500 font-bold text-lg hover:text-yellow-600 transition-colors">★</span>
            ) : (
                <span className="text-slate-200 font-bold text-lg hover:text-slate-400 transition-colors">☆</span>
            )}
        </button>
    )
}
