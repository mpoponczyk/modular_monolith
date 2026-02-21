import { Suspense } from 'react';
import { verifyPageAccess, verifyActionPermission } from '@/core/auth/actions';
import { SupabasePlanningRepository } from '../infrastructure/SupabasePlanningRepository';
import { AlertCircle, Calendar, Settings } from 'lucide-react';

const repository = new SupabasePlanningRepository();

export default async function PlanningPage({ params }: { params: { tenantSlug: string } }) {
    const { tenantId } = await verifyPageAccess(params.tenantSlug);
    await verifyActionPermission(tenantId, 'planning.manage');

    const items = await repository.getItems(tenantId);

    const maintenance = items.filter(i => i.type === 'maintenance');
    const announcements = items.filter(i => i.type === 'announcement');

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">System Planning</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Maintenance Section */}
                <div className="bg-white rounded-lg shadow border p-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-orange-500" />
                        Maintenance Windows
                    </h2>
                    {maintenance.length === 0 ? (
                        <p className="text-gray-500 text-sm">No scheduled maintenance.</p>
                    ) : (
                        <ul className="space-y-3">
                            {maintenance.map(m => (
                                <li key={m.id} className="border-l-4 border-orange-500 pl-3">
                                    <h3 className="font-medium">{m.title}</h3>
                                    <p className="text-xs text-gray-400">
                                        {new Date(m.start_at).toLocaleString()} - {new Date(m.end_at).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Announcements Section */}
                <div className="bg-white rounded-lg shadow border p-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-blue-500" />
                        Announcements
                    </h2>
                    {announcements.length === 0 ? (
                        <p className="text-gray-500 text-sm">No active announcements.</p>
                    ) : (
                        <ul className="space-y-3">
                            {announcements.map(a => (
                                <li key={a.id} className="bg-blue-50 p-3 rounded">
                                    <h3 className="font-medium text-blue-900">{a.title}</h3>
                                    <p className="text-xs text-blue-400 mb-1">
                                        {new Date(a.start_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-blue-700">{a.description}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
