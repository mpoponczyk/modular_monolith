"use client"

import { useTranslation } from "@/shared/i18n/client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface AdminPageHeaderProps {
    titleKey?: string
    subtitleKey?: string
    title?: string
    description?: string
    children?: ReactNode
    backLink?: string
    backLabel?: string
}

export function AdminPageHeader({ titleKey, subtitleKey, title, description, children, backLink, backLabel }: AdminPageHeaderProps) {
    const { t } = useTranslation()

    const displayTitle = title || (titleKey ? t(titleKey) : "")
    const displaySubtitle = description || (subtitleKey ? t(subtitleKey) : "")

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                {backLink && (
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href={backLink} title={backLabel}>
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                    </Button>
                )}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-blue-700">{displayTitle}</h1>
                    {displaySubtitle && (
                        <p className="text-muted-foreground">{displaySubtitle}</p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    )
}
