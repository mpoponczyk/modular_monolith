'use client'

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteRouteAction } from "../application/actions"
import { useParams } from "next/navigation"

export function DeleteRouteButton({ id }: { id: string }) {
    const t = (key: string) => key;
    const params = useParams();

    return (
        <form action={async () => {
            if (confirm(t('admin.routes.actions.deleteConfirm'))) {
                const result = await deleteRouteAction(params.tenantSlug as string, id)
                if (!result?.success && result?.error) {
                    alert(`${t('admin.routes.actions.deleteError')}${result.error}`)
                }
            }
        }}>
            <Button variant="ghost" size="icon" type="submit">
                <Trash2 size={16} className="text-red-500" />
            </Button>
        </form>
    )
}
