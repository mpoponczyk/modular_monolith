'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Pencil, Trash2, User, ShieldAlert, Star, Key } from "lucide-react"
import { createUser, updateUser, deleteUser, unlockUser, lockUser, resetUserPassword } from "../application/actions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { Lock, Unlock } from "lucide-react"

export function UsersContent({ users, roles, currentUserIsRoot, tenantSlug }: { users: any[], roles: any[], currentUserIsRoot: boolean, tenantSlug: string }) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [unlockingId, setUnlockingId] = useState<string | null>(null)

    const [email, setEmail] = useState("")
    const [login, setLogin] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phone, setPhone] = useState("")
    const [roleId, setRoleId] = useState<string>("none")
    const [isSuperadmin, setIsSuperadmin] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const resetForm = () => {
        setEmail("")
        setLogin("")
        setFirstName("")
        setLastName("")
        setPhone("")
        setRoleId("none")
        setIsSuperadmin(false)
        setEditingUser(null)
        setSaveError(null)
    }

    const handleSave = async () => {
        setSaveError(null)
        try {
            if (editingUser) {
                await updateUser(tenantSlug, editingUser.id, {
                    email,
                    firstName,
                    lastName,
                    phone,
                    roleId: roleId === 'none' ? null : roleId,
                    isSuperadmin
                })
            } else {
                await createUser(tenantSlug, {
                    email,
                    login,
                    firstName,
                    lastName,
                    phone,
                    roleId: roleId === 'none' ? null : roleId,
                    isSuperadmin
                })
            }
            setIsAddOpen(false)
            resetForm()
            window.location.reload()
        } catch (err: any) {
            console.error('[UsersContent] Save error:', err)
            let errorMessage = err.message || 'Wystąpił błąd podczas zapisywania'

            // Handle common database constraint violations
            if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
                if (errorMessage.includes('login')) {
                    errorMessage = 'Użytkownik z tym loginem już istnieje'
                } else if (errorMessage.includes('email')) {
                    errorMessage = 'Użytkownik z tym adresem email już istnieje'
                } else {
                    errorMessage = 'Ten rekord już istnieje w systemie'
                }
            }

            setSaveError(errorMessage)
        }
    }

    const startEdit = (user: any) => {
        setEditingUser(user)
        setFirstName(user.first_name || "")
        setLastName(user.last_name || "")
        setPhone(user.phone || "")
        setEmail(user.email || "")
        setLogin(user.login || "")
        setRoleId(user.role_id || "none")
        setIsSuperadmin(user.is_superadmin)
        setIsAddOpen(true)
    }

    const handleUnlock = async (user: any) => {
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
        if (!confirm(`Czy na pewno chcesz odblokować konto użytkownika ${userName}? Zostanie wysłany e-mail z linkiem do resetu hasła.`)) return
        setUnlockingId(user.id)
        try {
            await unlockUser(tenantSlug, user.id, user.email, user.first_name, user.last_name)
            alert("Konto zostało odblokowane.")
            window.location.reload()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setUnlockingId(null)
        }
    }

    const handleLock = async (user: any) => {
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
        if (!confirm(`Czy na pewno chcesz ZABLOKOWAĆ użytkownika ${userName}? Wszystkie jego sesje zostaną natychmiast zakończone.`)) return
        try {
            await lockUser(tenantSlug, user.id)
            alert("Użytkownik został zablokowany.")
            window.location.reload()
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleResetPassword = async (user: any) => {
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
        if (!confirm(`Czy na pewno chcesz zresetować hasło użytkownika ${userName}? Sesje zostaną zakończone, a na e-mail zostanie wysłany link.`)) return
        try {
            await resetUserPassword(tenantSlug, user.id, user.email, user.first_name, user.last_name)
            alert("Link do resetu hasła został wysłany.")
        } catch (err: any) {
            alert(err.message)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => { resetForm(); setIsAddOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Dodaj Użytkownika Technicznego
                </Button>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Użytkownik / Login</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dane Kontaktowe</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rola</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Bez imienia'}</div>
                                            {user.login && <div className="text-xs text-blue-600 font-bold font-mono">@{user.login}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-700">{user.email}</div>
                                    {user.phone && <div className="text-[10px] text-slate-500">{user.phone}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {user.locked_at ? (
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase border border-red-200">
                                                <Lock className="h-3 w-3 mr-1" /> ZABLOKOWANY
                                            </div>
                                        ) : user.is_active ? (
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase border border-emerald-200">
                                                Aktywny
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 uppercase border border-slate-200">
                                                Nieaktywny
                                            </div>
                                        )}
                                        {user.failed_attempts > 0 && !user.locked_at && (
                                            <div className="text-[10px] text-amber-600 font-bold">
                                                Próby: {user.failed_attempts}/4
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${user.admin_roles ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {user.admin_roles?.name || 'No Role Assigned'}
                                        </div>
                                        {user.is_superadmin && (
                                            <div className="flex items-center gap-1 text-amber-600 font-black text-[10px] uppercase">
                                                <Star className="h-3 w-3 fill-amber-600" />
                                                Dostęp Root
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        {user.locked_at || !user.is_active ? (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Odblokuj"
                                                onClick={() => handleUnlock(user)}
                                                disabled={unlockingId === user.id}
                                                className="h-8 w-8 text-red-600 hover:text-emerald-600 border-red-200"
                                            >
                                                <Lock className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Zablokuj"
                                                onClick={() => handleLock(user)}
                                                className="h-8 w-8 text-emerald-600 hover:text-red-600 border-emerald-200"
                                            >
                                                <Unlock className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Resetuj hasło"
                                            onClick={() => handleResetPassword(user)}
                                            className="h-8 w-8 text-slate-400 hover:text-amber-600"
                                        >
                                            <Key className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Edytuj" onClick={() => startEdit(user)} className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Usuń" onClick={() => { if (confirm('Czy na pewno chcesz usunąć tego użytkownika? Tej operacji nie można cofnąć.')) { deleteUser(tenantSlug, user.id); window.location.reload(); } }} className="h-8 w-8 text-slate-400 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Invite New Technical User'}</DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'Update user profile and permissions.'
                                : 'An invitation email will be sent to the user to set their password.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <label className="text-sm font-bold">Adres Email <span className="text-red-500">*</span></label>
                                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@zalew.pl" required />
                            </div>
                            {!editingUser && (
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-bold">Nowy Login <span className="text-red-500">*</span></label>
                                    <Input value={login} onChange={e => setLogin(e.target.value)} placeholder="mpoponczyk" required />
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <label className="text-sm font-bold">Imię <span className="text-red-500">*</span></label>
                                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jan" required />
                            </div>
                            <div className="grid gap-1.5">
                                <label className="text-sm font-bold">Nazwisko <span className="text-red-500">*</span></label>
                                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Kowalski" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="grid gap-1.5">
                                <label className="text-sm font-bold">Numer Telefonu <span className="text-red-500">*</span></label>
                                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+48..." required />
                            </div>
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-bold">Assigned Role</label>
                            <Select value={roleId} onValueChange={setRoleId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Role (Access only to common apps)</SelectItem>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {currentUserIsRoot && (
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                                    <div>
                                        <div className="text-sm font-bold text-amber-900">Uprawnienia Root (Bypass)</div>
                                        <div className="text-[10px] text-amber-700 font-medium">Pełny dostęp do systemu bez ograniczeń uprawnień</div>
                                    </div>
                                </div>
                                <Switch checked={isSuperadmin} onCheckedChange={setIsSuperadmin} />
                            </div>
                        )}
                    </div>
                    {saveError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                            {saveError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            {editingUser ? 'Update User' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
