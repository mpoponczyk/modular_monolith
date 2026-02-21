"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface AnalyticsCardProps {
    title: string
    value: string
    subtitle: string
    icon: React.ReactNode
    trend?: {
        value: string
        isUp: boolean
    }
    incrementLabel?: string
    incrementValue?: string
    data: number[] // For the bar chart
    className?: string
}

export function AnalyticsCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    incrementLabel,
    incrementValue,
    data,
    className
}: AnalyticsCardProps) {
    // Bar chart calculation
    const height = 45
    const width = 130
    const max = Math.max(...data) || 1
    const padding = 2
    const barWidth = (width / data.length) - padding

    return (
        <div className={cn(
            "relative overflow-hidden bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group",
            className
        )}>
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">{value}</h3>
                        {trend && (
                            <span className={cn(
                                "text-sm font-bold",
                                trend.isUp ? "text-emerald-600" : "text-rose-600"
                            )}>
                                ({trend.isUp ? '↑' : '↓'} {trend.value})
                            </span>
                        )}
                    </div>
                    {incrementValue && (
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">
                            {incrementLabel}: <span className="text-slate-700">{incrementValue}</span>
                        </p>
                    )}
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-blue-500 transition-all duration-300 shadow-sm group-hover:shadow-blue-100 group-hover:bg-blue-50">
                    {icon}
                </div>
            </div>

            <div className="mt-8 flex items-end justify-between relative z-10">
                <div className="space-y-1">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold italic opacity-80">{subtitle}</p>
                </div>

                {/* Bar Chart Visualization */}
                <div className="h-[45px] w-[130px] flex items-end gap-0.5 transition-all duration-500 group-hover:scale-105">
                    {data.map((val, i) => {
                        const barHeight = (val / max) * height
                        return (
                            <div
                                key={i}
                                className="bg-blue-500/30 group-hover:bg-blue-500 transition-all duration-500 rounded-t-[2px]"
                                style={{
                                    width: `${barWidth}px`,
                                    height: `${Math.max(barHeight, 4)}px`,
                                    opacity: 0.3 + (i / data.length) * 0.7
                                }}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Decorative Fiori background element */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
        </div>
    )
}
