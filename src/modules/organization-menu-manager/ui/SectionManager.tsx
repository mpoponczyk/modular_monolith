
'use client';

import React, { useState, useEffect } from 'react';
import {
    OrganizationSection,
    OrganizationSectionItem,
    OrganizationApp,
    OrganizationSectionTranslation,
    OrganizationLanguage
} from '../application/SectionService';
import {
    createSectionAction,
    updateSectionAction,
    deleteSectionAction,
    reorderSectionsAction,
    linkAppAction,
    unlinkItemAction,
    reorderItemsAction
} from '../actions';
import { ArrowUp, ArrowDown, Plus, Trash2, Edit2, Check, X, Link } from 'lucide-react';
// import { Button } from '@/components/legacy/ui/button'; // Using raw HTML button for simplicity if components fail to resolve
// Or strictly use existing components. Let's try raw Tailwind for absolute stability first, as requested in plan.

interface SectionManagerProps {
    tenantId: string;
    orgId: string;
    sections: OrganizationSection[];
    sectionTranslations: OrganizationSectionTranslation[];
    sectionItems: OrganizationSectionItem[];
    apps: OrganizationApp[];
    languages: OrganizationLanguage[];
    appTranslations: any[]; // Ignored for linking list for now, showing module_id. Or pass better struct.
}

interface SectionViewModel extends OrganizationSection {
    title: string;
    items: (OrganizationSectionItem & { app?: OrganizationApp })[];
}

export default function SectionManager({
    tenantId,
    orgId,
    sections,
    sectionTranslations,
    sectionItems,
    apps,
    languages,
    appTranslations
}: SectionManagerProps) {

    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // View Model Composition
    const defaultLang = languages.find(l => l.is_default)?.language_code || 'en';

    const viewModel: SectionViewModel[] = sections.map(section => {
        // Resolve Title (Current user perspective? Or Default Org Lanaguage?)
        // Admin Tool should likely show Default Language + Option to Edit All.
        const translation = sectionTranslations.find(t => t.section_id === section.id && t.language_code === defaultLang);
        const title = translation?.name || `[No Name - ${defaultLang}]`;

        const items = sectionItems
            .filter(i => i.section_id === section.id)
            .map(i => ({
                ...i,
                app: apps.find(a => a.id === i.organization_app_id)
            }))
            .sort((a, b) => a.order_index - b.order_index);

        return { ...section, title, items };
    });

    const activeApps = apps.filter(a => a.is_active);

    // Handlers

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);

        // Collect translations
        const translations: Record<string, string> = {};
        languages.forEach(l => {
            const val = formData.get(`name_${l.language_code}`) as string;
            if (val) translations[l.language_code] = val;
        });

        const res = await createSectionAction(tenantId, orgId, translations);
        setLoading(false);
        if (res.success) {
            setIsCreating(false);
        } else {
            setError(res.error);
        }
    };

    const handleUpdate = async (sectionId: string, translations: Record<string, string>) => {
        setLoading(true);
        setError(null);
        const res = await updateSectionAction(tenantId, orgId, sectionId, translations, true);
        setLoading(false);
        if (res.success) {
            setEditingSectionId(null);
        } else {
            setError(res.error);
        }
    };

    const handleDelete = async (sectionId: string) => {
        if (!confirm('Are you sure you want to delete this section?')) return;
        setLoading(true);
        const res = await deleteSectionAction(tenantId, orgId, sectionId);
        setLoading(false);
        if (!res.success) setError(res.error);
    };

    const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === viewModel.length - 1) return;

        const newOrder = [...viewModel.map(s => s.id)];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

        setLoading(true);
        await reorderSectionsAction(tenantId, orgId, newOrder);
        setLoading(false);
    };

    const handleLinkApp = async (sectionId: string, moduleId: string) => {
        if (!moduleId) return;
        setLoading(true);
        const res = await linkAppAction(tenantId, orgId, sectionId, moduleId);
        setLoading(false);
        if (!res.success) setError(res.error);
    };

    const handleUnlinkItem = async (itemId: string) => {
        setLoading(true);
        const res = await unlinkItemAction(tenantId, orgId, itemId);
        setLoading(false);
        if (!res.success) setError(res.error);
    };

    const handleMoveItem = async (sectionId: string, itemIds: string[], index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === itemIds.length - 1) return;

        const newOrder = [...itemIds];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

        setLoading(true);
        await reorderItemsAction(tenantId, orgId, sectionId, newOrder);
        setLoading(false);
    };


    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Menu Structure</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading || isCreating}
                >
                    <Plus size={16} /> Add Section
                </button>
            </div>

            {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 rounded border border-red-200">
                    Error: {error}
                </div>
            )}

            {isCreating && (
                <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded">
                    <h3 className="font-semibold mb-2">New Section</h3>
                    <form onSubmit={handleCreate}>
                        {languages.map(lang => (
                            <div key={lang.id} className="mb-2">
                                <label className="block text-xs font-medium text-slate-500 uppercase">
                                    {lang.language_code} {lang.is_default && '(Default)'}
                                </label>
                                <input
                                    name={`name_${lang.language_code}`}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder={`Section Name (${lang.language_code})`}
                                    required={lang.is_default}
                                />
                            </div>
                        ))}
                        <div className="flex gap-2 mt-4">
                            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded text-sm" disabled={loading}>Save</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1 bg-gray-200 rounded text-sm">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {viewModel.map((section, index) => (
                    <div key={section.id} className="border rounded bg-slate-50">
                        {/* Section Header */}
                        <div className="flex items-center justify-between p-3 bg-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => handleMoveSection(index, 'up')} disabled={index === 0 || loading} className="text-slate-400 hover:text-blue-600 disabled:opacity-30"><ArrowUp size={14} /></button>
                                    <button onClick={() => handleMoveSection(index, 'down')} disabled={index === viewModel.length - 1 || loading} className="text-slate-400 hover:text-blue-600 disabled:opacity-30"><ArrowDown size={14} /></button>
                                </div>
                                <div>
                                    <span className="font-medium text-slate-800">{section.title}</span>
                                    <div className="text-xs text-slate-400">Order: {section.order_index}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleDelete(section.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" disabled={loading}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {/* Section Items */}
                        <div className="p-3 pl-12 space-y-2">
                            {section.items.map((item, itemIndex) => (
                                <div key={item.id} className="flex items-center justify-between bg-white px-3 py-2 border rounded text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-0.5">
                                            <button onClick={() => handleMoveItem(section.id, section.items.map(i => i.id), itemIndex, 'up')} disabled={itemIndex === 0 || loading} className="text-slate-300 hover:text-blue-600 disabled:opacity-30"><ArrowUp size={12} /></button>
                                            <button onClick={() => handleMoveItem(section.id, section.items.map(i => i.id), itemIndex, 'down')} disabled={itemIndex === section.items.length - 1 || loading} className="text-slate-300 hover:text-blue-600 disabled:opacity-30"><ArrowDown size={12} /></button>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-700">{item.app?.module_id || '[Unknown App]'}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleUnlinkItem(item.id)} className="text-red-400 hover:text-red-600" disabled={loading}><X size={14} /></button>
                                </div>
                            ))}

                            {/* Link App Input */}
                            <div className="mt-2 flex gap-2">
                                <select
                                    className="flex-1 text-sm border rounded px-2 py-1 bg-white"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleLinkApp(section.id, e.target.value);
                                            e.target.value = ''; // Reset
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    <option value="">+ Link Item...</option>
                                    {activeApps
                                        .filter(a => !section.items.some(i => i.organization_app_id === a.id))
                                        .map(app => (
                                            <option key={app.id} value={app.module_id}>{app.module_id}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {viewModel.length === 0 && !isCreating && (
                <div className="text-center py-10 text-slate-400 italic">
                    No sections defined.
                </div>
            )}
        </div>
    );
}
