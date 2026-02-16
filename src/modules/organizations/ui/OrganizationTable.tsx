'use client';

import React, { useState } from 'react';
import { Organization } from '@/core/domain/types';
import { deleteOrganization } from '../actions';

interface OrganizationTableProps {
    orgs: Organization[];
}

export const OrganizationTable = ({ orgs }: OrganizationTableProps) => {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (orgId: string) => {
        if (!confirm('Are you sure you want to delete this organization?')) return;

        setIsDeleting(orgId);
        try {
            await deleteOrganization(orgId);
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {orgs.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                No organizations found.
                            </td>
                        </tr>
                    ) : (
                        orgs.map((org) => (
                            <tr key={org.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{org.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.owner_group_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                        onClick={() => handleDelete(org.id)}
                                        disabled={isDeleting === org.id}
                                        className="text-red-600 hover:text-red-900 ml-4 disabled:opacity-50"
                                    >
                                        {isDeleting === org.id ? 'Deleting...' : 'Delete'}
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
