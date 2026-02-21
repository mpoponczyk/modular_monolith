'use client';

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Monitor, XCircle, ShieldCheck, Activity, Clock, UserIcon, Shield } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { pl, enUS } from "date-fns/locale"
// Update to point to the correct action for revoking sessions
import { revokeSessionAction, updateHeartbeatAction } from "../application/actions"
import { Session } from "../domain/types"
import { useTranslation } from "@/shared/i18n/client"

interface SessionTableProps {
    initialSessions: (Session & {
        device_name?: string | null,
        is_trusted?: boolean,
        last_heartbeat_at?: string,
        session_type?: 'temporary' | 'trusted',
        admin_profiles?: { login: string, email: string, is_active: boolean }
    })[],
    currentDeviceId: string,
    isSuperadmin: boolean,
    timezone?: string,
    tenantSlug: string,
    locale?: string
}

export function SessionTable({
    initialSessions,
    currentDeviceId,
    isSuperadmin,
    timezone = 'Europe/Warsaw',
    tenantSlug,
    locale = 'pl'
}: SessionTableProps) {
    const [sessions, setSessions] = useState(initialSessions)
    const [mounted, setMounted] = useState(false)
    const [revokingId, setRevokingId] = useState<string | null>(null)
    const { t } = useTranslation()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Heartbeat logic
    useEffect(() => {
        if (!currentDeviceId) return

        const hb = () => updateHeartbeatAction()
        hb() // Immediate
        const interval = setInterval(hb, 30000) // 30s

        return () => clearInterval(interval)
    }, [currentDeviceId])

    const handleRevoke = async (sessionId: string) => {
        // Since t() returns the key if missing, we need to check if it returned the key or if we need a fallback.
        // Actually, t('sessions.actions.confirmLogout') handles it, but let's provide a safe fallback just in case it returns the raw key.
        const translatedMessage = t('sessions.actions.confirmLogout');
        const confirmMessage = translatedMessage !== 'sessions.actions.confirmLogout' ? translatedMessage : "Czy na pewno chcesz zamknąć tę sesję?";

        if (!window.confirm(confirmMessage)) return

        setRevokingId(sessionId)
        const res = await revokeSessionAction(tenantSlug, sessionId)
        if (res.success) {
            setSessions(prev => prev.filter(s => s.id !== sessionId))
            if (sessionId === currentDeviceId) {
                window.location.href = '/login'
            }
        } else {
            alert(res.error || "Wystąpił błąd")
        }
        setRevokingId(null)
    }

    const isOnline = (lastHb?: string | Date) => {
        if (!lastHb) return false
        const last = new Date(lastHb).getTime()
        const diff = Date.now() - last
        return diff < 60000 // 1 minute tolerance
    }

    if (!mounted) {
        return null
    }

    const dateLocale = locale === 'pl' ? pl : enUS;

    // Helper to safely fall back if the key is returned instead of translation
    const getT = (key: string, fallback: string) => {
        const val = t(key);
        return val === key ? fallback : val;
    }

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-zinc-900/50">
                        <TableRow className="hover:bg-transparent border-slate-200 dark:border-zinc-800">
                            <TableHead className="font-bold text-slate-700 dark:text-zinc-300 w-[250px]">{getT('sessions.headers.admin', "Administrator")}</TableHead>
                            <TableHead className="font-bold text-slate-700 dark:text-zinc-300">{getT('sessions.headers.device', "Urządzenie")}</TableHead>
                            <TableHead className="font-bold text-slate-700 dark:text-zinc-300">{getT('sessions.headers.type', "Typ")}</TableHead>
                            <TableHead className="font-bold text-slate-700 dark:text-zinc-300">{getT('sessions.headers.status', "Status")}</TableHead>
                            <TableHead className="font-bold text-slate-700 dark:text-zinc-300">{getT('sessions.headers.activity', "Aktywność")}</TableHead>
                            <TableHead className="font-bold text-slate-700 dark:text-zinc-300 text-right">{getT('sessions.headers.actions', "Akcje")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {sessions.map((session) => {
                                // Defaulting fallbacks for missing db fields to maintain UI structure
                                const lastHb = session.last_heartbeat_at || session.createdAt
                                const online = isOnline(lastHb)
                                const isCurrent = session.id === currentDeviceId
                                const deviceName = session.device_name || getT('sessions.labels.unknownDevice', "Nieznane urządzenie")
                                const isTrusted = session.session_type === 'trusted'

                                return (
                                    <motion.tr
                                        key={session.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`group hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors border-slate-100 dark:border-zinc-800 ${isCurrent ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                                                    <UserIcon size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-zinc-100 leading-none flex items-center gap-1.5">
                                                        {session.admin_profiles?.login || session.userId}
                                                        {isCurrent && (
                                                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-none">
                                                                {getT('sessions.badges.you', "Ty")}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{session.admin_profiles?.email || "-"}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
                                                    {deviceName.toLowerCase().includes("mobil") || deviceName.toLowerCase().includes("phone") || deviceName.toLowerCase().includes("android") || deviceName.toLowerCase().includes("ios") ? (
                                                        <Smartphone size={14} />
                                                    ) : (
                                                        <Monitor size={14} />
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{deviceName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isTrusted ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 font-bold text-[10px] uppercase gap-1">
                                                    <ShieldCheck size={12} />
                                                    {getT('sessions.badges.trusted', "Zaufane")}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700 font-bold text-[10px] uppercase">
                                                    {getT('sessions.badges.temporary', "Tymczasowa")}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {online ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{getT('sessions.badges.online', "Online")}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="flex h-2 w-2 rounded-full bg-slate-300 dark:bg-zinc-700" />
                                                        <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{getT('sessions.badges.offline', "Offline")}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                                    <Clock size={12} />
                                                    {formatDistanceToNow(new Date(lastHb || Date.now()), { addSuffix: true, locale: dateLocale })}
                                                </div>
                                                <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                                    <Activity size={10} />
                                                    {getT('sessions.labels.timeLog', "Log")}: {formatInTimeZone(new Date(session.createdAt || Date.now()), timezone, 'dd.MM HH:mm')}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold h-8 transition-all group-hover:scale-105"
                                                onClick={() => handleRevoke(session.id)}
                                                disabled={revokingId === session.id}
                                            >
                                                {revokingId === session.id ? (
                                                    <span className="animate-spin h-4 w-4 mr-1.5 border-2 border-red-500 border-t-transparent rounded-full" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 mr-1.5" />
                                                )}
                                                {getT('sessions.actions.logout', "Wyloguj")}
                                            </Button>
                                        </TableCell>
                                    </motion.tr>
                                )
                            })}
                        </AnimatePresence>
                    </TableBody>
                </Table>
                {sessions.length === 0 && (
                    <div className="p-16 text-center space-y-3 bg-slate-50/30 dark:bg-zinc-900/20">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                <Shield size={24} />
                            </div>
                        </div>
                        <p className="text-slate-400 dark:text-zinc-500 font-medium">
                            {getT('sessions.empty', "Brak aktywnych sesji do wyświetlenia.")}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
