'use client'

import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { updateTenantSettingsAction } from "../application/actions"
import { HeatmapThreshold, DEFAULT_HEATMAP_CONFIG } from "../domain/heatmap-config"
import { Plus, Trash2, User, Save, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SettingsUIProps {
    tenantSlug: string
    initialEmailEnabled: boolean
    initialTimezone: string
    initialHeatmapConfig: HeatmapThreshold[]
}

export function SettingsUI({
    tenantSlug,
    initialEmailEnabled,
    initialTimezone,
    initialHeatmapConfig,
}: SettingsUIProps) {
    const t = (key: string, defVal?: string) => defVal || key
    const [enabled, setEnabled] = useState(initialEmailEnabled)
    const [timezone, setTimezoneState] = useState(initialTimezone)
    const [loading, setLoading] = useState(false)

    // Common Timezones
    const timezones = [
        "Europe/Warsaw",
        "Europe/London",
        "Europe/Berlin",
        "Europe/Paris",
        "UTC",
        "America/New_York",
    ]

    async function handleEmailToggle(checked: boolean) {
        setLoading(true)
        const res = await updateTenantSettingsAction(tenantSlug, { email_enabled: checked })
        if (res.success) {
            setEnabled(checked)
        }
        setLoading(false)
    }

    async function handleTimezoneChange(val: string) {
        setLoading(true)
        setTimezoneState(val)
        await updateTenantSettingsAction(tenantSlug, { default_timezone: val })
        setLoading(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <Card>
                <CardHeader>
                    <CardTitle>{t('admin.settingsPage.notifications.title')}</CardTitle>
                    <CardDescription>
                        {t('admin.settingsPage.notifications.desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="email-toggle" className="flex flex-col space-y-1">
                            <span>{t('admin.settingsPage.notifications.enable')}</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                {t('admin.settingsPage.notifications.enableDesc')}
                            </span>
                        </Label>
                        <Switch id="email-toggle" checked={enabled} onCheckedChange={handleEmailToggle} disabled={loading} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('admin.settingsPage.regional.title')}</CardTitle>
                    <CardDescription>
                        {t('admin.settingsPage.regional.desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('admin.settingsPage.regional.timezone')}</Label>
                        <Select value={timezone} onValueChange={handleTimezoneChange} disabled={loading}>
                            <SelectTrigger className="w-full md:w-[280px]">
                                <SelectValue placeholder={t('admin.settingsPage.regional.selectTimezone')} />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {t('admin.settingsPage.regional.timezoneDesc')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <HeatmapSettings tenantSlug={tenantSlug} initialConfig={initialHeatmapConfig} />
        </div>
    )
}

function HeatmapSettings({ tenantSlug, initialConfig }: { tenantSlug: string, initialConfig: HeatmapThreshold[] }) {
    const t = (key: string, defVal?: string) => defVal || key
    const [config, setConfig] = useState<HeatmapThreshold[]>(initialConfig.sort((a, b) => a.threshold - b.threshold))
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    async function handleSave() {
        // Validation: Unique thresholds
        const thresholds = config.map(c => c.threshold)
        if (new Set(thresholds).size !== thresholds.length) {
            alert(t('admin.settingsPage.heatmap.errorDuplicate', 'Duplicate thresholds are not allowed'))
            return
        }

        setSaving(true)
        const res = await updateTenantSettingsAction(tenantSlug, { heatmap_config: config.sort((a, b) => a.threshold - b.threshold) as any })
        if (res.success) {
            setLastSaved(new Date())
            setTimeout(() => setLastSaved(null), 3000)
        } else {
            alert(res.error || t('common.error'))
        }
        setSaving(false)
    }

    function updateColor(index: number, colorHex: string) {
        setConfig(prev => prev.map((item, i) =>
            i === index ? { ...item, color: colorHex } : item
        ))
    }

    function updateThreshold(index: number, value: string) {
        const num = parseInt(value)
        if (isNaN(num)) return

        setConfig(prev => prev.map((item, i) =>
            i === index ? { ...item, threshold: Math.min(100, Math.max(0, num)) } : item
        ))
    }

    function removeThreshold(index: number) {
        if (config.length <= 1) return
        setConfig(prev => prev.filter((_, i) => i !== index))
    }

    function addThreshold() {
        const lastThreshold = config.length > 0 ? config[config.length - 1].threshold : 0
        const newThreshold = Math.min(100, lastThreshold + 10)

        setConfig(prev => [...prev, {
            threshold: newThreshold,
            color: "#64748b"
        }].sort((a, b) => a.threshold - b.threshold))
    }

    function handleReset() {
        setConfig([...DEFAULT_HEATMAP_CONFIG].sort((a, b) => a.threshold - b.threshold))
    }

    // Helper for contrast text color in preview
    const getContrastYIQ = (hexcolor: string) => {
        hexcolor = hexcolor.replace("#", "")
        if (hexcolor.length === 3) {
            hexcolor = hexcolor.split('').map(c => c + c).join('')
        }
        const r = parseInt(hexcolor.substring(0, 2), 16)
        const g = parseInt(hexcolor.substring(2, 4), 16)
        const b = parseInt(hexcolor.substring(4, 6), 16)
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
        return (yiq >= 140) ? 'black' : 'white'
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t('admin.settingsPage.heatmap.title')}</CardTitle>
                        <CardDescription>{t('admin.settingsPage.heatmap.desc')}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                            {t('admin.settingsPage.heatmap.default')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={addThreshold} disabled={saving}>
                            <Plus size={14} className="mr-1" />
                            {t('common.add')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3">
                    {config.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 p-3 border rounded-xl group bg-slate-50/30 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">{t('admin.settingsPage.heatmap.threshold', 'Threshold')}</Label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            value={item.threshold}
                                            onChange={(e) => updateThreshold(idx, e.target.value)}
                                            className="w-16 h-10 px-3 text-sm font-bold border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                                            min="0"
                                            max="100"
                                            disabled={saving}
                                        />
                                        <span className="text-sm font-bold text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-1">
                                <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">{t('admin.settingsPage.heatmap.color', 'Color')}</Label>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm flex-1 max-w-[180px]">
                                        <input
                                            type="color"
                                            value={item.color}
                                            onChange={(e) => updateColor(idx, e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                            disabled={saving}
                                        />
                                        <span className="text-xs font-mono font-medium text-slate-600 uppercase flex-1">{item.color}</span>
                                    </div>

                                    <div
                                        className="h-10 px-4 flex items-center justify-center rounded-lg border text-[10px] font-bold uppercase tracking-wider min-w-[100px] shadow-sm transition-all"
                                        style={{
                                            backgroundColor: item.color,
                                            color: getContrastYIQ(item.color),
                                            borderColor: 'rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {t('admin.settingsPage.heatmap.preview')}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                    onClick={() => removeThreshold(idx)}
                                    disabled={saving}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t mt-4">
                    {lastSaved && (
                        <span className="text-sm text-green-600 font-bold animate-in fade-in slide-in-from-right-2">
                            ✓ {t('admin.settingsPage.heatmap.saved')}
                        </span>
                    )}
                    <Button onClick={handleSave} disabled={saving} className="min-w-[160px] h-11 bg-slate-900 hover:bg-slate-800 shadow-lg">
                        {saving ? t('common.loading') : t('admin.settingsPage.heatmap.save')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
