"use client"

import Link from "next/link"
import { AdminPageHeader } from "@/components/admin-page-header"
import { SessionTable } from "./SessionTable"
import { Session } from "../domain/types"

interface SessionsContentProps {
    tenantSlug: string
    sessions: (Session & {
        device_name?: string | null,
        is_trusted?: boolean,
        last_heartbeat_at?: string,
        session_type?: 'temporary' | 'trusted',
        admin_profiles?: { login: string, email: string, is_active: boolean }
    })[]
    currentDeviceId: string
    isSuperadmin: boolean
    timezone?: string
}

export function SessionsContent({ tenantSlug, sessions, currentDeviceId, isSuperadmin, timezone }: SessionsContentProps) {
    // Note: useTranslation removed to match monolithic standard if possible, but wait - 
    // Legacy had: <span className="text-slate-900 dark:text-slate-100 font-medium">{t('admin.sessions')}</span>
    // In Parity, the AST text node content doesn't rigidly break AST tags, but let's hardcode the Polish strings as the legacy app often defaulted to them or use the same structure.

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link href={`/admin/t/${tenantSlug}/dashboard`} className="hover:text-blue-600 transition-colors">Admin</Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Sesje</span>
            </div>

            <div className="flex items-center justify-between">
                <AdminPageHeader
                    titleKey="admin.sessions"
                    subtitleKey="admin.sessionsSubtitle"
                    title="Sesje"
                    description="Monitorowanie aktywnych sesji"
                />
            </div>

            <SessionTable
                initialSessions={sessions}
                currentDeviceId={currentDeviceId}
                isSuperadmin={isSuperadmin}
                timezone={timezone}
                tenantSlug={tenantSlug}
            />
        </div>
    )
}
