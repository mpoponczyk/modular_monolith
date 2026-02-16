'use client';

import React, { useState } from 'react';
import { ServiceOffering } from '@/core/domain/types';
import { deleteServiceOffering } from '../actions';
import Link from 'next/link';

interface ServiceOfferingTableProps {
    offerings: ServiceOffering[];
    tenantSlug: string;
}

export const ServiceOfferingTable = ({ offerings, tenantSlug }: ServiceOfferingTableProps) => {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this offering?')) return;

        setIsDeleting(id);
        try {
            await deleteServiceOffering(id);
        } catch (e: any) {
            alert('Failed to delete: ' + e.message);
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {offerings.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                No service offerings found.
                            </td>
                        </tr>
                    ) : (
                        offerings.map((offering) => (
                            <tr key={offering.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                    <Link href={`/admin/t/${tenantSlug}/service-offerings/${offering.id}`}>
                                        {offering.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{offering.project_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{offering.owner_group_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                        onClick={() => handleDelete(offering.id)}
                                        disabled={isDeleting === offering.id}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    >
                                        {isDeleting === offering.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
