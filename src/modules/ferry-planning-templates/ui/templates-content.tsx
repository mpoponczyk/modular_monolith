"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Calendar, ArrowRight } from "lucide-react"
import { TemplateDialog } from "./template-dialog"
import { deleteTemplate, addItemToTemplate, deleteTemplateItem } from "../application/actions"

interface TemplatesContentProps {
    tenantSlug: string
    templates: any[]
    routes: any[]
}

export function TemplatesContent({ tenantSlug, templates, routes }: TemplatesContentProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Szablony Harmonogramu</h2>
                    <p className="text-muted-foreground">Zarządzaj powtarzającymi się rozkładami w postaci szablonów.</p>
                </div>
                <TemplateDialog tenantSlug={tenantSlug} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template: any) => (
                    <Card key={template.id} className="flex flex-col">
                        <CardHeader className="pb-3 bg-slate-50 border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Calendar size={18} className="text-blue-600" />
                                        {template.name}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">
                                        {template.description || "Brak opisu"}
                                    </CardDescription>
                                </div>
                                <form action={async () => { await deleteTemplate(tenantSlug, template.id) }}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 bg-white space-y-4">
                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {template.items?.sort((a: any, b: any) => a.departure_time.localeCompare(b.departure_time)).map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded border bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 rounded">
                                                {item.departure_time.slice(0, 5)}
                                            </div>
                                            <div className="flex flex-col text-xs text-slate-600">
                                                <span className="font-semibold flex items-center gap-1">
                                                    {item.route?.origin?.name} <ArrowRight size={10} /> {item.route?.destination?.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {item.route?.estimated_duration_minutes} min
                                                </span>
                                            </div>
                                        </div>
                                        <form action={async () => { await deleteTemplateItem(tenantSlug, item.id) }}>
                                            <button className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity">
                                                <Trash2 size={14} />
                                            </button>
                                        </form>
                                    </div>
                                ))}
                                {(!template.items || template.items.length === 0) && (
                                    <div className="text-center py-8 text-slate-300 text-xs italic">
                                        Brak dodanych odcinków rejsu
                                    </div>
                                )}
                            </div>

                            {/* Mini Form to Add Item */}
                            <form action={async (formData) => {
                                formData.append('tenantSlug', tenantSlug);
                                await addItemToTemplate(template.id, formData)
                            }} className="pt-2 border-t mt-auto">
                                <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-center">
                                    <select name="route_id" defaultValue="" className="text-xs h-8 rounded border-slate-200 border px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" required>
                                        <option value="" disabled>Wybierz trasę...</option>
                                        {routes?.map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                {r.origin?.name} - {r.destination?.name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="time"
                                        name="departure_time"
                                        className="text-xs h-8 rounded border-slate-200 border px-2 w-[80px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                    <Button size="icon" className="h-8 w-8 bg-slate-900 hover:bg-slate-800">
                                        <Plus size={14} />
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
