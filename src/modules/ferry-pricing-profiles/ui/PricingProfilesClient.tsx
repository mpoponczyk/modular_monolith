'use client';

import { useState, useTransition } from 'react';
import { createProfileAction, updateProfileAction, deleteProfileAction } from '../application/actions';
import { PriceProfile } from '../domain/ports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit, Plus, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function PricingProfilesClient({ tenantSlug, initialProfiles }: { tenantSlug: string, initialProfiles: PriceProfile[] }) {
    const [profiles, setProfiles] = useState<PriceProfile[]>(initialProfiles);
    const [isPending, startTransition] = useTransition();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Partial<PriceProfile>>({});

    const handleOpenModal = (profile?: PriceProfile) => {
        setEditingProfile(profile || { isActive: true, currency: 'USD' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProfile({});
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('name', editingProfile.name || '');
                formData.append('description', editingProfile.description || '');
                formData.append('basePriceAdult', editingProfile.basePriceAdult?.toString() || '0');
                formData.append('basePriceChild', editingProfile.basePriceChild?.toString() || '0');
                formData.append('basePriceVehicle', editingProfile.basePriceVehicle?.toString() || '0');
                formData.append('basePriceBike', editingProfile.basePriceBike?.toString() || '0');
                formData.append('currency', editingProfile.currency || 'USD');
                if (editingProfile.isActive) formData.append('isActive', 'on');

                if (editingProfile.id) {
                    await updateProfileAction(tenantSlug, editingProfile.id, formData);
                } else {
                    await createProfileAction(tenantSlug, formData);
                }

                handleCloseModal();
            } catch (err: any) {
                alert(err.message || 'Error occurred');
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this pricing profile?')) return;
        startTransition(async () => {
            try {
                await deleteProfileAction(tenantSlug, id);
            } catch (e: any) {
                alert(e.message || 'Error during deletion');
            }
        });
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Profile
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map(profile => (
                    <div key={profile.id} className="bg-white p-4 rounded-lg shadow border flex flex-col relative">
                        <div className="flex justify-between items-start mb-2 border-b pb-2">
                            <div>
                                <h3 className="font-semibold text-lg">{profile.name}</h3>
                                <p className="text-gray-500 text-sm h-10 line-clamp-2">{profile.description || 'No description'}</p>
                            </div>
                        </div>
                        <div className="space-y-1 mb-4 flex-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Adult:</span>
                                <span>{profile.basePriceAdult} {profile.currency}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Child:</span>
                                <span>{profile.basePriceChild} {profile.currency}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Vehicle:</span>
                                <span>{profile.basePriceVehicle} {profile.currency}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Bike:</span>
                                <span>{profile.basePriceBike} {profile.currency}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                                <span className="text-gray-600">Status:</span>
                                <span className={profile.isActive ? "text-green-600 font-medium" : "text-gray-400 font-medium"}>
                                    {profile.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-2">
                            <Button variant="outline" className="flex-1" onClick={() => handleOpenModal(profile)} disabled={isPending}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button variant="destructive" onClick={() => handleDelete(profile.id)} disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingProfile.id ? "Edit Profile" : "New Profile"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input value={editingProfile.name || ''} onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input value={editingProfile.description || ''} onChange={e => setEditingProfile({ ...editingProfile, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Adult Price</label>
                                <Input type="number" value={editingProfile.basePriceAdult?.toString() || ''} onChange={e => setEditingProfile({ ...editingProfile, basePriceAdult: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Child Price</label>
                                <Input type="number" value={editingProfile.basePriceChild?.toString() || ''} onChange={e => setEditingProfile({ ...editingProfile, basePriceChild: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Vehicle Price</label>
                                <Input type="number" value={editingProfile.basePriceVehicle?.toString() || ''} onChange={e => setEditingProfile({ ...editingProfile, basePriceVehicle: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bike Price</label>
                                <Input type="number" value={editingProfile.basePriceBike?.toString() || ''} onChange={e => setEditingProfile({ ...editingProfile, basePriceBike: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Currency</label>
                                <Input value={editingProfile.currency || ''} onChange={e => setEditingProfile({ ...editingProfile, currency: e.target.value })} />
                            </div>
                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center gap-2">
                                    <Switch checked={editingProfile.isActive ?? true} onCheckedChange={c => setEditingProfile({ ...editingProfile, isActive: c })} />
                                    <label className="text-sm font-medium">Active</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseModal} disabled={isPending}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
