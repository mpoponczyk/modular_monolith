'use client';

import React, { useState } from 'react';
import { Cockpit, CockpitConfig } from '../domain/types';
import { upsertCockpitAction, deleteCockpitAction } from '../application/actions';
import { Plus, Trash2, Edit, Save, X, Layout, Loader2 } from 'lucide-react';

interface CockpitManagerProps {
    tenantId: string;
    cockpits: Cockpit[];
}

export default function CockpitManager({ tenantId, cockpits }: CockpitManagerProps) {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [currentCockpit, setCurrentCockpit] = useState<Partial<Cockpit>>({});
    const [jsonConfig, setJsonConfig] = useState<string>('{"widgets": []}');
    const [loading, setLoading] = useState(false);

    const handleNew = () => {
        setCurrentCockpit({ name: 'New Cockpit', is_default: false });
        setJsonConfig(JSON.stringify({
            widgets: [
                { id: '1', type: 'metric', title: 'Revenue', x: 0, y: 0, w: 4, h: 2 },
                { id: '2', type: 'chart', title: 'Sales Trend', x: 0, y: 2, w: 8, h: 4 }
            ]
        }, null, 2));
        setView('edit');
    };

    const handleEdit = (c: Cockpit) => {
        setCurrentCockpit(c);
        setJsonConfig(JSON.stringify(c.config_json, null, 2));
        setView('edit');
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const config = JSON.parse(jsonConfig) as CockpitConfig;

            if (!currentCockpit.name) throw new Error('Name is required');

            await upsertCockpitAction(tenantId, currentCockpit.id || null, currentCockpit.name, config);
            setView('list');
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        await deleteCockpitAction(tenantId, id);
    };

    if (view === 'edit') {
        return (
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layout className="w-5 h-5 text-gray-500" />
                        {currentCockpit.id ? 'Edit Cockpit' : 'New Cockpit'}
                    </h2>
                    <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            value={currentCockpit.name || ''}
                            onChange={(e) => setCurrentCockpit({ ...currentCockpit, name: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="My Dashboard"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Configuration (JSON)</label>
                            <textarea
                                value={jsonConfig}
                                onChange={(e) => setJsonConfig(e.target.value)}
                                className="w-full h-96 font-mono text-sm p-2 border rounded bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Define widgets array with type, x, y, w, h</p>
                        </div>

                        <div className="border rounded bg-gray-50 p-4">
                            <label className="block text-sm font-medium mb-4 text-center">Preview (Grid Layout)</label>
                            <div className="grid grid-cols-12 gap-2 auto-rows-[50px] bg-white border p-4 rounded min-h-[300px]">
                                {(() => {
                                    try {
                                        const config = JSON.parse(jsonConfig);
                                        return config.widgets?.map((w: any) => (
                                            <div
                                                key={w.id}
                                                className="bg-blue-100 border border-blue-300 rounded flex items-center justify-center text-xs text-blue-800 font-medium relative group"
                                                style={{
                                                    gridColumn: `span ${w.w || 2}`,
                                                    gridRow: `span ${w.h || 2}`
                                                }}
                                            >
                                                {w.title} ({w.type})
                                            </div>
                                        ));
                                    } catch (e) {
                                        return <div className="col-span-12 text-red-500 text-sm">Invalid JSON</div>;
                                    }
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button onClick={() => setView('list')} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    New Cockpit
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cockpits.map((c) => (
                    <div key={c.id} className="bg-white rounded-lg shadow-sm border p-4 flex flex-col group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded text-blue-600">
                                    <Layout className="w-5 h-5" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(c)} className="p-1 text-gray-400 hover:text-blue-600">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(c.id)} className="p-1 text-gray-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            {c.config_json?.widgets?.length || 0} Widgets
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
