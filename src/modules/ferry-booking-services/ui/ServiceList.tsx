'use client';

import React, { useState, useTransition } from 'react';
import { Service } from '../domain/service-types';
import { upsertServiceAction, deleteServiceAction } from '../application/actions';
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ServiceListProps {
    tenantSlug: string;
    services: Service[];
    dict?: any;
}

export default function ServiceList({ tenantSlug, services, dict }: ServiceListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Partial<Service>>({});
    const [isPending, startTransition] = useTransition();

    const handleOpenModal = (service?: Service) => {
        setEditingService(service || { is_active: true });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingService({});
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                const res = await upsertServiceAction(tenantSlug, editingService);
                if (res.success) {
                    handleCloseModal();
                } else {
                    alert(res.error);
                }
            } catch (err: any) {
                alert(err.message || 'Error occurred');
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm(dict?.common?.confirmDelete || 'Are you sure?')) return;
        startTransition(async () => {
            await deleteServiceAction(tenantSlug, id);
        });
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {dict?.services?.newService || "New Service"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                    <div key={service.id} className="bg-white p-4 rounded-lg shadow border flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gray-100 rounded">
                                    {/* Placeholder Icon */}
                                    <div className="w-5 h-5 bg-gray-300 rounded" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {service.is_active ? (dict?.common?.active || 'Active') : (dict?.common?.inactive || 'Inactive')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(service)} className="h-8 w-8 text-gray-400 hover:text-blue-600">
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="h-8 w-8 text-gray-400 hover:text-red-600" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm flex-1">{service.description || dict?.services?.noDescription || 'No description'}</p>
                    </div>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService.id ? (dict?.services?.editService || 'Edit Service') : (dict?.services?.newService || 'New Service')}</DialogTitle>
                        <DialogDescription>
                            {dict?.services?.serviceFormDescription || 'Configure the additional service details and availability status.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">{dict?.services?.form?.name || 'Name'}</label>
                            <Input
                                type="text"
                                value={editingService.name || ''}
                                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">{dict?.services?.form?.description || 'Description'}</label>
                            <Textarea
                                value={editingService.description || ''}
                                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={editingService.is_active}
                                onCheckedChange={(checked) => setEditingService({ ...editingService, is_active: checked })}
                            />
                            <label className="text-sm font-medium">{dict?.common?.active || 'Active'}</label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseModal} disabled={isPending}>{dict?.common?.cancel || 'Cancel'}</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {dict?.common?.save || 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
