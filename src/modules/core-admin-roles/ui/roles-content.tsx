'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Check, ShieldCheck } from "lucide-react"
import { createRoleAction, updateRoleAction, deleteRoleAction } from "../application/actions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

export function RolesContent({ tenantSlug, roles, availableApps }: { tenantSlug: string, roles: any[], availableApps: any[] }) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<any>(null)

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [selectedApps, setSelectedApps] = useState<string[]>([])

    // UX States
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const resetForm = () => {
        setName("")
        setDescription("")
        setSelectedApps([])
        setEditingRole(null)
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            const formData = new FormData()
            formData.append('name', name)
            formData.append('description', description)

            // Pass selected apps as a JSON string to our bridge action
            formData.append('apps', JSON.stringify(selectedApps))

            if (editingRole) {
                await updateRoleAction(tenantSlug, editingRole.id, formData)
            } else {
                await createRoleAction(tenantSlug, formData)
            }
            setIsAddOpen(false)
            resetForm()
        } catch (error: any) {
            alert(error.message || "Wystąpił błąd podczas zapisywania roli")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (roleId: string) => {
        if (!window.confirm("Czy na pewno chcesz usunąć tę rolę?")) return

        try {
            setDeletingId(roleId)
            await deleteRoleAction(tenantSlug, roleId)
        } catch (error: any) {
            alert(error.message || "Wystąpił błąd podczas usuwania roli")
        } finally {
            setDeletingId(null)
        }
    }

    const startEdit = (role: any) => {
        setEditingRole(role)
        setName(role.name)
        setDescription(role.description)
        setSelectedApps(role.admin_role_apps ? role.admin_role_apps.map((a: any) => a.app_id) : [])
        setIsAddOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => { resetForm(); setIsAddOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Create New Role
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow border-slate-200">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(role)} className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(role.id)}
                                        disabled={deletingId === role.id}
                                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                                    >
                                        {deletingId === role.id ? (
                                            <span className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{role.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 h-10 overflow-hidden line-clamp-2">{role.description}</p>

                            <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access to:</div>
                                <div className="flex flex-wrap gap-1">
                                    {role.admin_role_apps && role.admin_role_apps.map((app: any) => {
                                        const appInfo = availableApps.find(a => a.id === app.app_id)
                                        return (
                                            <div key={app.app_id} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-700">
                                                <Check className="h-3 w-3 text-green-600" />
                                                {appInfo?.name || app.app_id}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                        <DialogDescription>
                            Define a role name and select which applications it can access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="grid gap-1.5">
                                <label className="text-sm font-bold">Role Name</label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Schedule Manager" />
                            </div>
                            <div className="grid gap-1.5">
                                <label className="text-sm font-bold">Description</label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What can this role do?" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold">Assign Applications</label>
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                                {availableApps.map((app) => (
                                    <div key={app.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`app-${app.id}`}
                                            checked={selectedApps.includes(app.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedApps([...selectedApps, app.id])
                                                else setSelectedApps(selectedApps.filter(id => id !== app.id))
                                            }}
                                        />
                                        <label htmlFor={`app-${app.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                            {app.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                            {isSaving ? (
                                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                            ) : null}
                            {editingRole ? 'Update Role' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
